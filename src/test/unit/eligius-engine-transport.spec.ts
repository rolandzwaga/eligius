import {EndableAction, TimelineAction} from '@action/index.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/index.ts';
import type {ILocaleManager} from '@locale/types.ts';
import type {
  IPlaylist,
  IPositionSource,
  ISeekable,
  TSourceState,
} from '@timelineproviders/types.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EligiusEngine} from '@/eligius-engine.ts';
import type {IEligiusEngineOptions, ITimelineProviderInfo} from '@/types.ts';

/**
 * Overlapping transport commands (seek, switchTimeline, start, stop,
 * destroy), action failures during reconciliation and start/end sequencing,
 * driven through manual position sources so every interleaving is explicit.
 */

type ManualSource = IPositionSource &
  ISeekable & {report(position: number): void};

/**
 * A position source that reports whatever positions the test feeds it. It
 * emits on activate and on seek while active, like BasePositionSource.
 */
function createManualPositionSource(duration = 10): ManualSource {
  const positionCallbacks: Array<(position: number) => void> = [];
  const activatedCallbacks: Array<() => void> = [];
  let state: TSourceState = 'inactive';
  let position = 0;
  const emit = (value: number) => {
    positionCallbacks.forEach(callback => callback(value));
  };
  return {
    get state() {
      return state;
    },
    loop: false,
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(() => {
      state = 'inactive';
    }),
    activate: vi.fn(async () => {
      if (state === 'active') {
        return;
      }
      state = 'active';
      emit(position);
      activatedCallbacks.forEach(callback => callback());
    }),
    suspend: vi.fn(() => {
      if (state === 'active') {
        state = 'suspended';
      }
    }),
    deactivate: vi.fn(() => {
      state = 'inactive';
      position = 0;
    }),
    getPosition: () => position,
    getDuration: () => duration,
    onPosition: vi.fn(callback => {
      positionCallbacks.push(callback);
      return () => {};
    }),
    onBoundaryReached: vi.fn(() => () => {}),
    onActivated: vi.fn(callback => {
      activatedCallbacks.push(callback);
      return () => {};
    }),
    seek: vi.fn(async (value: number) => {
      position = value;
      if (state === 'active') {
        emit(value);
      }
      return value;
    }),
    report(value: number) {
      position = value;
      if (state === 'active') {
        emit(value);
      }
    },
  };
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function op(id: string, instance: (data: any) => any): IResolvedOperation {
  return {id, systemName: id, operationData: {}, instance};
}

function record(log: string[], label: string) {
  return op(label, data => {
    log.push(label);
    return data;
  });
}

function recordingAction(
  log: string[],
  name: string,
  start: number,
  end: number
) {
  return new TimelineAction(
    name,
    [record(log, `${name}-start`)],
    [record(log, `${name}-end`)],
    {start, end},
    new Eventbus()
  );
}

/**
 * A recording action whose end operation only finishes when `release()` is
 * called.
 */
function slowEndingAction(
  log: string[],
  name: string,
  start: number,
  end: number
) {
  let release = () => {};
  const action = new TimelineAction(
    name,
    [record(log, `${name}-start`)],
    [
      op(
        `${name}-end`,
        data =>
          new Promise(resolve => {
            log.push(`${name}-end-begin`);
            release = () => {
              log.push(`${name}-end-done`);
              resolve(data);
            };
          })
      ),
    ],
    {start, end},
    new Eventbus()
  );
  return {action, release: () => release()};
}

function failingAction(
  name: string,
  start: number,
  end: number,
  phase: 'start' | 'end'
) {
  const fail = () => {
    throw new Error(`${name} ${phase} failed`);
  };
  const pass = (data: any) => data;
  const action = new TimelineAction(
    name,
    [op(`${name}-start`, phase === 'start' ? fail : pass)],
    [op(`${name}-end`, phase === 'end' ? fail : pass)],
    {start, end},
    new Eventbus()
  );
  action.id = `${name}-id`;
  return action;
}

interface ITimelineSetup {
  uri: string;
  source: IPositionSource;
  actions?: TimelineAction[];
  loop?: boolean;
  duration?: number;
  playlist?: IPlaylist;
}

function createEngine(
  timelines: ITimelineSetup[],
  {
    initActions = [],
    localesReady,
    options,
  }: {
    initActions?: EndableAction[];
    localesReady?: Promise<void>;
    options?: IEligiusEngineOptions;
  } = {}
) {
  const configuration: any = {
    containerSelector: '.transport-root',
    layoutTemplate: '<div class="stage"></div>',
    initActions,
    timelines: timelines.map(timeline => ({
      type: 'animation',
      uri: timeline.uri,
      duration: timeline.duration ?? 10,
      selector: '.stage',
      loop: timeline.loop ?? false,
      timelineActions: timeline.actions ?? [],
    })),
  };
  const byUri: Record<string, ITimelineProviderInfo> = {};
  timelines.forEach(timeline => {
    byUri[timeline.uri] = timeline.playlist
      ? {positionSource: timeline.source, playlist: timeline.playlist}
      : {positionSource: timeline.source};
  });
  const localeManager = {destroy: vi.fn()} as unknown as ILocaleManager;
  return new EligiusEngine(
    configuration,
    new Eventbus(),
    {animation: byUri[timelines[0].uri]} as any,
    localeManager,
    byUri,
    localesReady,
    options
  );
}

describe('EligiusEngine transport commands', () => {
  beforeEach(() => {
    $('<div class="transport-root"/>').appendTo(document.body);
  });

  afterEach(() => {
    $('.transport-root').remove();
  });

  describe('failing actions during seek and switch', () => {
    test('given A [2,8] whose start operation throws and a healthy B [3,9], when seek(5) is awaited, then it resolves, B is started, seekComplete is emitted and an error names A', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const a = failingAction('A', 2, 8, 'start');
      const b = recordingAction(log, 'B', 3, 9);
      const engine = createEngine([{uri: 't1', source, actions: [a, b]}]);
      const errors = vi.fn();
      const seekComplete = vi.fn();
      engine.on('error', errors);
      engine.on('seekComplete', seekComplete);
      await engine.init();

      await expect(engine.seek(5)).resolves.toBe(5);
      await flush();

      expect(log).toEqual(['B-start']);
      expect(b.active).toBe(true);
      expect(seekComplete).toHaveBeenCalledTimes(1);
      expect(errors).toHaveBeenCalledTimes(1);
      expect(errors.mock.calls[0][0]).toMatchObject({
        actionName: 'A',
        phase: 'start',
      });
    });

    test('given active actions X and Y on t1 where the end of X throws, when switchTimeline(t2) is awaited, then it resolves, Y is ended, t2 is active and an end-phase error names X', async () => {
      const log: string[] = [];
      const s1 = createManualPositionSource();
      const s2 = createManualPositionSource();
      const x = failingAction('X', 0, 10, 'end');
      const y = recordingAction(log, 'Y', 0, 10);
      const engine = createEngine([
        {uri: 't1', source: s1, actions: [x, y]},
        {uri: 't2', source: s2},
      ]);
      const errors = vi.fn();
      engine.on('error', errors);
      await engine.init();
      await engine.start();
      s1.report(1);
      expect(x.active && y.active).toBe(true);

      await expect(engine.switchTimeline('t2')).resolves.toBeUndefined();

      expect(log).toEqual(['Y-start', 'Y-end']);
      expect(y.active).toBe(false);
      expect(engine.currentTimelineUri).toBe('t2');
      expect(s2.state).toBe('active');
      expect(errors).toHaveBeenCalledTimes(1);
      expect(errors.mock.calls[0][0]).toMatchObject({
        actionName: 'X',
        phase: 'end',
      });
    });
  });

  describe('overlapping commands', () => {
    test('given C [0,3] active with a slow end and A [4,6] and B [7,9], when seek(5) and then seek(8) are called before C has ended, then only B is active once C has ended', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const c = slowEndingAction(log, 'C', 0, 3);
      const a = recordingAction(log, 'A', 4, 6);
      const b = recordingAction(log, 'B', 7, 9);
      const engine = createEngine([
        {uri: 't1', source, actions: [c.action, a, b]},
      ]);
      await engine.init();
      await engine.start();
      source.report(1);

      const toFive = engine.seek(5);
      const toEight = engine.seek(8);
      await flush();
      c.release();
      await Promise.all([toFive, toEight]);
      await flush();

      expect(a.active).toBe(false);
      expect(b.active).toBe(true);
      expect(log).toEqual(['C-start', 'C-end-begin', 'C-end-done', 'B-start']);
    });

    test('given a stop whose cleanup is still running, when start() and then switchTimeline(t2) are called, then only the t2 source is active afterwards', async () => {
      const log: string[] = [];
      const s1 = createManualPositionSource();
      const s2 = createManualPositionSource();
      const c = slowEndingAction(log, 'C', 0, 10);
      const engine = createEngine([
        {uri: 't1', source: s1, actions: [c.action]},
        {uri: 't2', source: s2},
      ]);
      await engine.init();
      await engine.start();
      s1.report(1);

      const stopped = engine.stop();
      const started = engine.start();
      const switched = engine.switchTimeline('t2');
      await flush();
      // The end of stop(); start() restarts C, and the switch ends it again.
      c.release();
      await flush();
      c.release();
      await Promise.all([stopped, started, switched]);
      await flush();

      expect(engine.currentTimelineUri).toBe('t2');
      expect(s1.state).toBe('inactive');
      expect(s2.state).toBe('active');
    });

    test('given seek(5) waiting behind a slow end, when stop() is called, then the seek does not start the actions covering 5', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const c = slowEndingAction(log, 'C', 0, 3);
      const a = recordingAction(log, 'A', 4, 6);
      const engine = createEngine([
        {uri: 't1', source, actions: [c.action, a]},
      ]);
      const seekComplete = vi.fn();
      engine.on('seekComplete', seekComplete);
      await engine.init();
      await engine.start();
      source.report(1);

      const seeking = engine.seek(5);
      await flush();
      const stopping = engine.stop();
      c.release();
      await Promise.all([seeking, stopping]);
      await flush();

      expect(a.active).toBe(false);
      expect(log).not.toContain('A-start');
      expect(seekComplete).not.toHaveBeenCalled();
    });

    test('given a pending start() behind a running seek, when pause() is called, then the start does not activate the timeline', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const c = slowEndingAction(log, 'C', 0, 3);
      const engine = createEngine([{uri: 't1', source, actions: [c.action]}]);
      const started = vi.fn();
      engine.on('start', started);
      await engine.init();
      await engine.start();
      source.report(1);
      engine.pause();
      started.mockClear();

      const seeking = engine.seek(5);
      const starting = engine.start();
      engine.pause();
      await flush();
      c.release();
      await Promise.all([seeking, starting]);

      expect(engine.playState).toBe('paused');
      expect(started).not.toHaveBeenCalled();
    });

    test('given RAF-like ticks while a seek waits for a slow end, when the playhead crosses the start of an action the seek ended, then that action is active afterwards', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const d = recordingAction(log, 'D', 8, 12);
      const e = slowEndingAction(log, 'E', 8.5, 10);
      const engine = createEngine([
        {uri: 't1', source, actions: [d, e.action]},
      ]);
      await engine.init();
      await engine.start();
      source.report(9);
      expect(d.active && e.action.active).toBe(true);

      const seeking = engine.seek(7.95);
      await flush();
      source.report(8.05);
      e.release();
      await seeking;
      await flush();

      expect(d.active).toBe(true);
      expect(e.action.active).toBe(false);
      expect(log).toEqual([
        'D-start',
        'E-start',
        'E-end-begin',
        'D-end',
        'D-start',
        'E-end-done',
      ]);
    });

    test('given B [4,5) started by a seek to 4.9 behind a slow end, when ticks cross 5 before the seek finishes, then B is ended afterwards', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const c = slowEndingAction(log, 'C', 0, 3);
      const b = recordingAction(log, 'B', 4, 5);
      const engine = createEngine([
        {uri: 't1', source, actions: [c.action, b]},
      ]);
      await engine.init();
      await engine.start();
      source.report(1);

      const seeking = engine.seek(4.9);
      await flush();
      source.report(5.1);
      c.release();
      await seeking;
      await flush();

      expect(b.active).toBe(false);
      expect(log).toEqual([
        'C-start',
        'C-end-begin',
        'C-end-done',
        'B-start',
        'B-end',
      ]);
    });

    test('given a seek that ends an action whose end operation never settles, when start() is called afterwards, then playback starts', async () => {
      const source = createManualPositionSource();
      const hung = new TimelineAction(
        'Hung',
        [op('pass', data => data)],
        [op('never', () => new Promise(() => {}))],
        {start: 0, end: 3},
        new Eventbus()
      );
      const engine = createEngine([{uri: 't1', source, actions: [hung]}]);
      await engine.init();
      await engine.start();
      source.report(1);
      engine.pause();

      engine.seek(5);
      await flush();
      const result = await Promise.race([
        engine.start(),
        flush().then(() => 'blocked'),
      ]);

      expect(result).toBeUndefined();
      expect(engine.playState).toBe('playing');
    });

    test('given a covering action whose start never settles, when seek(5) is called, then it still resolves and emits seekComplete', async () => {
      const source = createManualPositionSource();
      const hanging = new TimelineAction(
        'Hanging',
        [op('never', () => new Promise(() => {}))],
        [],
        {start: 0, end: 10},
        new Eventbus()
      );
      const engine = createEngine([{uri: 't1', source, actions: [hanging]}]);
      const seekComplete = vi.fn();
      engine.on('seekComplete', seekComplete);
      await engine.init();

      const result = await Promise.race([
        engine.seek(5),
        flush().then(() => 'still pending'),
      ]);

      expect(result).toBe(5);
      expect(seekComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('start and end sequencing', () => {
    test('given a looping timeline with action [0,10] whose end operations are asynchronous, when the source wraps from 10 to 0 in one tick, then the start operations run after the end operations finished', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const a = slowEndingAction(log, 'A', 0, 10);
      const engine = createEngine([
        {uri: 't1', source, actions: [a.action], loop: true},
      ]);
      await engine.init();
      await engine.start();
      expect(log).toEqual(['A-start']);

      source.report(9.9);
      source.report(10);
      source.report(0);
      await flush();
      expect(log).toEqual(['A-start', 'A-end-begin']);

      a.release();
      await flush();

      expect(log).toEqual(['A-start', 'A-end-begin', 'A-end-done', 'A-start']);
      expect(a.action.active).toBe(true);
    });

    test('given B [3,4) whose start awaits a fetch, when one update jumps over the whole range, then its end operations run after its start operations', async () => {
      const log: string[] = [];
      const fetched = deferred();
      const source = createManualPositionSource();
      const b = new TimelineAction(
        'B',
        [
          op('loadJson', data => fetched.promise.then(() => data)),
          record(log, 'B-start'),
        ],
        [record(log, 'B-end')],
        {start: 3, end: 4},
        new Eventbus()
      );
      const engine = createEngine([{uri: 't1', source, actions: [b]}]);
      await engine.init();
      await engine.start();

      source.report(2.9);
      source.report(4.2);
      await flush();
      expect(log).toEqual([]);

      fetched.resolve();
      await flush();

      expect(log).toEqual(['B-start', 'B-end']);
      expect(b.active).toBe(false);
    });

    test('given A [2,5) with a slow end, B [5,8) and C [5.1,8), when updates reach 5 and then 5.1 before A has ended, then C starts after B', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const a = slowEndingAction(log, 'A', 2, 5);
      const b = recordingAction(log, 'B', 5, 8);
      const c = recordingAction(log, 'C', 5.1, 8);
      const engine = createEngine([
        {uri: 't1', source, actions: [a.action, b, c]},
      ]);
      await engine.init();
      await engine.start();
      source.report(3);

      source.report(5);
      source.report(5.1);
      await flush();
      expect(log).toEqual(['A-start', 'A-end-begin']);

      a.release();
      await flush();

      expect(log).toEqual([
        'A-start',
        'A-end-begin',
        'A-end-done',
        'B-start',
        'C-start',
      ]);
    });

    test('given no start or end between two positions, when the source reports them, then no start batch is dispatched', async () => {
      const source = createManualPositionSource();
      const log: string[] = [];
      const engine = createEngine([
        {uri: 't1', source, actions: [recordingAction(log, 'A', 5, 8)]},
      ]);
      await engine.init();
      await engine.start();
      const runPendingStarts = vi.spyOn(engine as any, '_runPendingStarts');

      [0.1, 0.2, 0.3, 0.4, 0.5].forEach(p => source.report(p));

      expect(runPendingStarts).not.toHaveBeenCalled();
      expect(log).toEqual([]);
    });
  });

  describe('source initialisation failures', () => {
    test('given a t2 source whose init rejects once, when switchTimeline(t2) fails and is called again, then t1 kept running and the second call initialises and activates t2', async () => {
      const log: string[] = [];
      const s1 = createManualPositionSource();
      const s2 = createManualPositionSource(20);
      (s2.init as any).mockRejectedValueOnce(new Error('video failed to load'));
      const t1Action = recordingAction(log, 'T1', 0, 10);
      const engine = createEngine([
        {uri: 't1', source: s1, actions: [t1Action]},
        {uri: 't2', source: s2},
      ]);
      const timelineChange = vi.fn();
      engine.on('timelineChange', timelineChange);
      await engine.init();
      await engine.start();
      s1.report(1);

      await expect(engine.switchTimeline('t2')).rejects.toThrow(
        'video failed to load'
      );

      expect(engine.currentTimelineUri).toBe('t1');
      expect(s1.state).toBe('active');
      expect(t1Action.active).toBe(true);
      expect(timelineChange).not.toHaveBeenCalled();

      await engine.switchTimeline('t2');

      expect(s2.init).toHaveBeenCalledTimes(2);
      expect(s2.onPosition).toHaveBeenCalledTimes(1);
      expect(engine.currentTimelineUri).toBe('t2');
      expect(engine.duration).toBe(20);
      expect(s2.state).toBe('active');
    });

    test('given a first source whose init rejects once, when init() fails and is called again, then the source is initialised again and its callbacks are registered once', async () => {
      const source = createManualPositionSource();
      (source.init as any).mockRejectedValueOnce(new Error('not found'));
      const engine = createEngine([{uri: 't1', source}]);

      await expect(engine.init()).rejects.toThrow('not found');
      await engine.init();

      expect(source.init).toHaveBeenCalledTimes(2);
      expect(source.onPosition).toHaveBeenCalledTimes(1);
    });

    test('given timelines of 10s and 20s, when a timelineChange listener reads the duration, then it gets the new timeline duration', async () => {
      const s1 = createManualPositionSource(10);
      const s2 = createManualPositionSource(20);
      const engine = createEngine([
        {uri: 't1', source: s1},
        {uri: 't2', source: s2, duration: 20},
      ]);
      const durations: Array<number | undefined> = [];
      engine.on('timelineChange', () => durations.push(engine.duration));
      await engine.init();

      await engine.switchTimeline('t2');

      expect(durations).toEqual([20]);
    });
  });

  describe('play and pause events', () => {
    function createSlowStartingSource() {
      const source = createManualPositionSource();
      const playing = deferred();
      let state: TSourceState = 'inactive';
      Object.defineProperty(source, 'state', {get: () => state});
      source.activate = vi.fn(async () => {
        state = 'active';
        await playing.promise;
      });
      source.suspend = vi.fn(() => {
        if (state === 'active') {
          state = 'suspended';
        }
      });
      return {source, play: () => playing.resolve()};
    }

    test('given a mediaplayer source whose play is pending, when pause() is called before it settles, then pause is emitted and start never is', async () => {
      const {source, play} = createSlowStartingSource();
      const engine = createEngine([{uri: 't1', source}]);
      const events: string[] = [];
      engine.on('start', () => events.push('start'));
      engine.on('pause', () => events.push('pause'));
      await engine.init();

      const starting = engine.start();
      engine.pause();
      play();
      await starting;

      expect(events).toEqual(['pause']);
      expect(engine.playState).toBe('paused');
    });

    test('given a stopped engine, when pause() is called, then no pause event is emitted', async () => {
      const engine = createEngine([
        {uri: 't1', source: createManualPositionSource()},
      ]);
      const pause = vi.fn();
      engine.on('pause', pause);
      await engine.init();

      engine.pause();

      expect(pause).not.toHaveBeenCalled();
    });

    test('given a playing engine, when start() is called again, then start is emitted once', async () => {
      const engine = createEngine([
        {uri: 't1', source: createManualPositionSource()},
      ]);
      const start = vi.fn();
      engine.on('start', start);
      await engine.init();

      await engine.start();
      await engine.start();

      expect(start).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy during pending commands', () => {
    test('given a switchTimeline waiting for its source to initialise, when destroy() runs meanwhile, then the source is not activated, its actions do not start and it is destroyed', async () => {
      const log: string[] = [];
      const s1 = createManualPositionSource();
      const s2 = createManualPositionSource();
      const loading = deferred();
      s2.init = vi.fn(() => loading.promise);
      const engine = createEngine([
        {uri: 't1', source: s1},
        {uri: 't2', source: s2, actions: [recordingAction(log, 'T2', 0, 10)]},
      ]);
      await engine.init();
      await engine.start();

      const switching = engine.switchTimeline('t2');
      await flush();
      await engine.destroy();
      expect(s2.destroy).not.toHaveBeenCalled();
      loading.resolve();
      await switching;
      await flush();

      expect(s2.activate).not.toHaveBeenCalled();
      expect(log).toEqual([]);
      expect(s2.destroy).toHaveBeenCalledTimes(1);
      expect(engine.playState).toBe('stopped');
    });

    test('given init() waiting for external locales, when destroy() runs meanwhile, then init rejects and the source is never initialised', async () => {
      const locales = deferred();
      const source = createManualPositionSource();
      const engine = createEngine([{uri: 't1', source}], {
        localesReady: locales.promise,
      });

      const initialising = engine.init();
      await engine.destroy();
      locales.resolve();

      await expect(initialising).rejects.toThrow(/destroyed/);
      expect(source.init).not.toHaveBeenCalled();
      expect(source.activate).not.toHaveBeenCalled();
    });

    test('given a start() waiting for the cleanup of stop(), when destroy() runs meanwhile, then the source is not activated again', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const c = slowEndingAction(log, 'C', 0, 10);
      const engine = createEngine([{uri: 't1', source, actions: [c.action]}]);
      await engine.init();
      await engine.start();
      source.report(1);

      const stopped = engine.stop();
      const started = engine.start();
      const destroyed = engine.destroy();
      c.release();
      await Promise.all([stopped, started, destroyed]);
      await flush();

      expect(source.activate).toHaveBeenCalledTimes(1);
      expect(source.state).toBe('inactive');
    });

    test('given an init action with end operations, when destroy() is called twice, then its end operations run once', async () => {
      const log: string[] = [];
      const initAction = new EndableAction(
        'Init',
        [record(log, 'init-start')],
        [record(log, 'init-end')],
        new Eventbus()
      );
      const engine = createEngine(
        [{uri: 't1', source: createManualPositionSource()}],
        {initActions: [initAction]}
      );
      await engine.init();

      const first = engine.destroy();
      const second = engine.destroy();
      await Promise.all([first, second]);
      await engine.destroy();

      expect(second).toBe(first);
      expect(log).toEqual(['init-start', 'init-end']);
    });

    test('given init() that failed before any init action started, when destroy() is awaited, then no init action end operations run', async () => {
      const log: string[] = [];
      const initAction = new EndableAction(
        'Init',
        [record(log, 'init-start')],
        [record(log, 'init-end')],
        new Eventbus()
      );
      const source = createManualPositionSource();
      (source.init as any).mockRejectedValueOnce(new Error('not found'));
      const engine = createEngine([{uri: 't1', source}], {
        initActions: [initAction],
      });
      await expect(engine.init()).rejects.toThrow('not found');

      await engine.destroy();

      expect(log).toEqual([]);
    });

    test('given a destroyed engine, when commands are called, then they do nothing and init() rejects', async () => {
      const source = createManualPositionSource();
      const engine = createEngine([
        {uri: 't1', source},
        {uri: 't2', source: createManualPositionSource()},
      ]);
      await engine.init();
      await engine.destroy();

      await engine.start();
      await engine.switchTimeline('t2');
      await expect(engine.seek(2)).resolves.toBe(0);
      await expect(engine.init()).rejects.toThrow(/destroyed/);

      expect(source.activate).not.toHaveBeenCalled();
      expect(engine.currentTimelineUri).toBe('t1');
    });
  });

  describe('switchTimeline validation', () => {
    test('given an engine without init(), when switchTimeline is called, then it rejects saying the engine is not initialised', async () => {
      const engine = createEngine([
        {uri: 't1', source: createManualPositionSource()},
      ]);

      await expect(engine.switchTimeline('t1')).rejects.toThrow(
        /not initialised/
      );
    });

    test('given timelines intro and main, when switchTimeline is called with a misspelt URI, then it rejects naming the URI, a suggestion and the known URIs', async () => {
      const engine = createEngine([
        {uri: 'intro', source: createManualPositionSource()},
        {uri: 'main', source: createManualPositionSource()},
      ]);
      await engine.init();

      await expect(engine.switchTimeline('mian')).rejects.toThrow(
        "EligiusEngine.switchTimeline('mian'): unknown timeline URI. Did you mean 'main'? Known timelines: 'intro', 'main'"
      );
    });

    test('given a playlist that has no item for the target URI, when switchTimeline is awaited, then it rejects naming the URI and the current timeline keeps playing', async () => {
      const log: string[] = [];
      const first = createManualPositionSource();
      const second = createManualPositionSource();
      const playlist: IPlaylist = {
        currentItem: {uri: 't1'},
        items: [{uri: 't1'}],
        selectItem: vi.fn(),
        hasItem: vi.fn((identifier: string) => identifier === 't1'),
        onItemChange: vi.fn(() => () => {}),
      };
      const engine = createEngine([
        {
          uri: 't1',
          source: first,
          actions: [recordingAction(log, 'A', 0, 10)],
        },
        {uri: 't2', source: second, playlist},
      ]);
      await engine.init();
      await engine.start();

      await expect(engine.switchTimeline('t2')).rejects.toThrow(
        "EligiusEngine.switchTimeline('t2'): the timeline's playlist has no item 't2'"
      );

      expect(first.deactivate).not.toHaveBeenCalled();
      expect(first.state).toBe('active');
      expect(second.init).not.toHaveBeenCalled();
      expect(playlist.selectItem).not.toHaveBeenCalled();
      expect(engine.currentTimelineUri).toBe('t1');
      expect(engine.playState).toBe('playing');
      expect(log).toEqual(['A-start']);
    });

    test('given a playlist whose hasItem knows the target URI, when switchTimeline is awaited, then it switches and selects the item', async () => {
      const second = createManualPositionSource();
      const playlist: IPlaylist = {
        currentItem: {uri: 't1'},
        items: [{uri: 't1'}, {uri: 't2'}],
        selectItem: vi.fn(),
        hasItem: vi.fn(() => true),
        onItemChange: vi.fn(() => () => {}),
      };
      const engine = createEngine([
        {uri: 't1', source: createManualPositionSource()},
        {uri: 't2', source: second, playlist},
      ]);
      await engine.init();

      await engine.switchTimeline('t2');

      expect(playlist.hasItem).toHaveBeenCalledWith('t2');
      expect(playlist.selectItem).toHaveBeenCalledWith('t2');
      expect(engine.currentTimelineUri).toBe('t2');
    });
  });

  describe('keyboard timeline-switch requests', () => {
    type SwitchingSource = ManualSource & {
      requestChange(direction: 'prev' | 'next'): void;
      onTimelineChangeRequest: ReturnType<typeof vi.fn>;
      changeCallbacks: Array<(direction: 'prev' | 'next') => void>;
    };

    /** A manual source that, like KeyboardStepSource, asks for timeline changes */
    function createSwitchingSource(): SwitchingSource {
      const source = createManualPositionSource() as SwitchingSource;
      source.changeCallbacks = [];
      source.onTimelineChangeRequest = vi.fn(
        (callback: (direction: 'prev' | 'next') => void) => {
          source.changeCallbacks.push(callback);
          return () => {
            source.changeCallbacks = source.changeCallbacks.filter(
              registered => registered !== callback
            );
          };
        }
      );
      source.requestChange = direction => {
        source.changeCallbacks.forEach(callback => callback(direction));
      };
      return source;
    }

    test('given three timelines with switching sources, when next is requested twice and prev once, then the engine moves to t2, t3 and back to t2 at position 0', async () => {
      const sources = [
        createSwitchingSource(),
        createSwitchingSource(),
        createSwitchingSource(),
      ];
      const engine = createEngine([
        {uri: 't1', source: sources[0]},
        {uri: 't2', source: sources[1]},
        {uri: 't3', source: sources[2]},
      ]);
      const changes: string[] = [];
      engine.on('timelineChange', uri => changes.push(uri));
      await engine.init();
      await engine.start();
      sources[0].report(4);

      sources[0].requestChange('next');
      await flush();
      sources[1].report(2);
      sources[1].requestChange('next');
      await flush();
      sources[2].requestChange('prev');
      await flush();

      expect(changes).toEqual(['t2', 't3', 't2']);
      expect(engine.currentTimelineUri).toBe('t2');
      expect(engine.position).toBe(0);
    });

    test('given the first and the last timeline, when prev is requested on the first and next on the last, then nothing switches', async () => {
      const first = createSwitchingSource();
      const last = createSwitchingSource();
      const engine = createEngine([
        {uri: 't1', source: first},
        {uri: 't2', source: last},
      ]);
      const changes: string[] = [];
      engine.on('timelineChange', uri => changes.push(uri));
      await engine.init();
      await engine.start();

      first.requestChange('prev');
      await flush();
      expect(changes).toEqual([]);

      first.requestChange('next');
      await flush();
      last.requestChange('next');
      await flush();

      expect(changes).toEqual(['t2']);
      expect(engine.currentTimelineUri).toBe('t2');
    });

    test('given a source that is not the active one, when it requests a change, then the engine ignores it', async () => {
      const first = createSwitchingSource();
      const second = createSwitchingSource();
      const engine = createEngine([
        {uri: 't1', source: first},
        {uri: 't2', source: second},
      ]);
      await engine.init();
      await engine.switchTimeline('t2');
      const changes: string[] = [];
      engine.on('timelineChange', uri => changes.push(uri));

      first.requestChange('next');
      first.requestChange('prev');
      await flush();

      expect(changes).toEqual([]);
      expect(engine.currentTimelineUri).toBe('t2');
    });

    test('given a switch that fails because the next source cannot initialise, when next is requested, then the failure is reported through the error event and t1 stays active', async () => {
      const first = createSwitchingSource();
      const broken = createSwitchingSource();
      (broken.init as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('video failed to load')
      );
      const engine = createEngine([
        {uri: 't1', source: first},
        {uri: 't2', source: broken},
      ]);
      const errors = vi.fn();
      engine.on('error', errors);
      await engine.init();
      await engine.start();

      first.requestChange('next');
      await flush();

      expect(errors).toHaveBeenCalledTimes(1);
      const [error] = errors.mock.calls[0];
      expect(error.message).toContain("switchTimeline('t2')");
      expect(error.message).toContain('video failed to load');
      expect(error.cause).toEqual(new Error('video failed to load'));
      expect(engine.currentTimelineUri).toBe('t1');
      expect(engine.playState).toBe('playing');
    });

    test('given a single timeline, when the engine is initialised, then it does not ask the source for timeline change requests', async () => {
      const only = createSwitchingSource();
      const engine = createEngine([{uri: 't1', source: only}]);

      await engine.init();

      expect(only.onTimelineChangeRequest).not.toHaveBeenCalled();
    });

    test('given an initialised engine, when it is destroyed, then its timeline change registration is removed', async () => {
      const first = createSwitchingSource();
      const engine = createEngine([
        {uri: 't1', source: first},
        {uri: 't2', source: createSwitchingSource()},
      ]);
      await engine.init();
      expect(first.onTimelineChangeRequest).toHaveBeenCalledTimes(1);
      expect(first.changeCallbacks).toHaveLength(1);

      await engine.destroy();

      expect(first.changeCallbacks).toHaveLength(0);
    });
  });

  describe('schedule and engine root', () => {
    test('given an action with an open end (-1), when the engine is initialised and plays, then the configured duration is not changed and the action is never ended', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const open = recordingAction(log, 'Open', 2, -1);
      const engine = createEngine([{uri: 't1', source, actions: [open]}]);
      await engine.init();
      await engine.start();

      [1, 3, 9.5].forEach(p => source.report(p));

      expect(open.duration.end).toBe(-1);
      expect(open.active).toBe(true);
      expect(log).toEqual(['Open-start']);
    });

    test('given an initialised engine, when engineRoot is read twice and requested over the eventbus, then the same jQuery instance is returned', async () => {
      const engine = createEngine([
        {uri: 't1', source: createManualPositionSource()},
      ]);
      await engine.init();
      const viaEventbus = vi.fn();

      const root = engine.engineRoot;
      (engine as any).eventbus.broadcast('request-engine-root', [viaEventbus]);

      expect(engine.engineRoot).toBe(root);
      expect(viaEventbus).toHaveBeenCalledWith(root);
      expect(root[0]).toBe($('.transport-root')[0]);
    });

    test('given maxCatchUp of 2 seconds, when the playhead jumps from 1 to 8, then the jump is reconciled like a seek and the skipped momentary action does not run', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngine(
        [
          {
            uri: 't1',
            source,
            actions: [
              recordingAction(log, 'Momentary', 3, 4),
              recordingAction(log, 'Covering', 5, 9),
            ],
          },
        ],
        {options: {maxCatchUp: 2}}
      );
      await engine.init();
      await engine.start();
      source.report(1);

      source.report(8);
      source.report(8.5);

      expect(log).toEqual(['Covering-start']);
    });

    test('given the default options, when the playhead jumps from 1 to 8, then every skipped action still starts and ends', async () => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngine([
        {
          uri: 't1',
          source,
          actions: [
            recordingAction(log, 'Momentary', 3, 4),
            recordingAction(log, 'Covering', 5, 9),
          ],
        },
      ]);
      await engine.init();
      await engine.start();
      source.report(1);

      source.report(8);
      await flush();

      expect(log).toEqual([
        'Momentary-start',
        'Momentary-end',
        'Covering-start',
      ]);
    });

    test('given an invalid maxCatchUp, when the engine is constructed, then it throws naming the option', () => {
      expect(() =>
        createEngine([{uri: 't1', source: createManualPositionSource()}], {
          options: {maxCatchUp: 0},
        })
      ).toThrow(/options\.maxCatchUp must be a positive number/);
    });
  });

  describe('error logging', () => {
    test('given no error subscriber and only a forward-only one, when a dispatched action fails, then the error message is logged with its cause', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const source = createManualPositionSource();
      const failing = failingAction('Failing', 2, 5, 'start');
      const engine = createEngine([{uri: 't1', source, actions: [failing]}]);
      const forwarded = vi.fn();
      engine.on('error', forwarded, {forwardOnly: true});
      await engine.init();
      await engine.start();

      source.report(3);
      await flush();

      expect(forwarded).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        "Error in action start 'Failing' at operation 'Failing-start' (index 0): Failing start failed",
        expect.objectContaining({message: 'Failing start failed'})
      );
    });
  });
});
