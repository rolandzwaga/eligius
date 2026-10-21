import type {
  IEngineConfiguration,
  IOperationConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from '@configuration/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import type {TOperationData} from '@operation/types.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactoryResult} from '@/types.ts';

/**
 * Safety net for the engine core: builds engines through EngineFactory with a
 * real Eventbus, the real adapters and a real RafPositionSource. Only
 * animationInterval is mocked, so each test drives the RAF clock by hand with
 * `tick(elapsedMs)`.
 */
const raf = vi.hoisted(() => ({
  callback: null as ((elapsed: number) => void) | null,
  signal: null as AbortSignal | null,
}));

vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(
    (_ms: number, signal: AbortSignal, callback: (elapsed: number) => void) => {
      raf.callback = callback;
      raf.signal = signal;
    }
  ),
}));

function tick(elapsedMs: number) {
  if (raf.signal && !raf.signal.aborted) {
    raf.callback?.(elapsedMs);
  }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

let opId = 0;
function op(
  systemName: string,
  operationData: TOperationData = {}
): IOperationConfiguration<TOperationData> {
  opId++;
  return {id: `op-${opId}`, systemName, operationData};
}

function probe(label: string) {
  return op('broadcastEvent', {eventName: 'probe', eventArgs: [label]});
}

function timelineAction(
  name: string,
  start: number,
  end: number,
  withEnd = true
): ITimelineActionConfiguration {
  return {
    id: `action-${name}`,
    name,
    duration: {start, end},
    startOperations: [probe(`${name}-start`)],
    endOperations: withEnd ? [probe(`${name}-end`)] : [],
  };
}

function timeline(
  uri: string,
  duration: number,
  timelineActions: ITimelineActionConfiguration[] = [],
  loop = false
): ITimelineConfiguration {
  return {
    id: uri,
    uri,
    type: 'animation',
    duration,
    loop,
    selector: '#stage',
    timelineActions,
  };
}

function createConfig(
  overrides: Partial<IEngineConfiguration> = {}
): IEngineConfiguration {
  return {
    id: 'engine-core-config',
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {
      animation: {
        positionSource: {systemName: 'RafPositionSource', tickInterval: 100},
        container: {systemName: 'DomContainerProvider', selector: '#stage'},
      },
    },
    containerSelector: '#engine-root',
    cssFiles: [],
    language: 'en-US',
    layoutTemplate: '<div id="stage"></div>',
    availableLanguages: [],
    initActions: [],
    actions: [],
    timelines: [timeline('t1', 10)],
    ...overrides,
  };
}

function countCalls(eventbus: IEventbus, eventName: string) {
  const spy = vi.fn();
  eventbus.on(eventName as any, spy);
  return spy;
}

describe('EngineFactory lifecycle (integration)', () => {
  let eventbus: Eventbus;
  let factory: EngineFactory;
  let result: IEngineFactoryResult | undefined;
  let probes: string[];

  beforeEach(() => {
    raf.callback = null;
    raf.signal = null;
    $('<div id="engine-root"></div>').appendTo(document.body);
    eventbus = new Eventbus();
    factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });
    probes = [];
    eventbus.on('probe' as any, (label: string) => probes.push(label));
    result = undefined;
  });

  afterEach(async () => {
    if (result) {
      await result.destroy().catch(() => {});
    }
    factory.destroy();
    $('#engine-root').remove();
  });

  async function create(config: IEngineConfiguration) {
    result = factory.createEngine(config);
    await result.engine.init();
    return result;
  }

  test('given a stopped factory-created engine, when timeline-play-toggle-request is broadcast twice, then it plays and then pauses, broadcasting each state once', async () => {
    const {engine} = await create(createConfig());
    const play = countCalls(eventbus, 'timeline-play');
    const pause = countCalls(eventbus, 'timeline-pause');

    eventbus.broadcast('timeline-play-toggle-request', []);
    await flush();

    expect(engine.playState).toBe('playing');
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();

    eventbus.broadcast('timeline-play-toggle-request', []);
    await flush();

    expect(engine.playState).toBe('paused');
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  test('given a playing engine, when timeline-seek-request is broadcast once, then the seek runs once', async () => {
    const {engine} = await create(createConfig());
    await engine.start();
    const seek = countCalls(eventbus, 'timeline-seek');
    const seeked = countCalls(eventbus, 'timeline-seeked');

    eventbus.broadcast('timeline-seek-request', [4]);
    await flush();

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seeked).toHaveBeenCalledTimes(1);
    expect(engine.position).toBe(4);
  });

  test('given a playing engine, when one tick occurs, then timeline-time is broadcast exactly once', async () => {
    const {engine} = await create(createConfig());
    await engine.start();
    const time = countCalls(eventbus, 'timeline-time');

    tick(100);

    expect(time).toHaveBeenCalledTimes(1);
    expect(time).toHaveBeenCalledWith(0.1);
  });

  test('given an action at [0.35, 0.75] and skipped RAF frames, when the clock jumps over both keys, then the action starts and ends exactly once', async () => {
    const {engine} = await create(
      createConfig({
        timelines: [timeline('t1', 10, [timelineAction('A', 0.35, 0.75)])],
      })
    );
    await engine.start();

    tick(500);
    expect(probes).toEqual(['A-start']);

    tick(1000);
    expect(probes).toEqual(['A-start', 'A-end']);

    tick(1100);
    expect(probes).toEqual(['A-start', 'A-end']);
  });

  test('given a first frame, when a listener calls the timeline-duration argument, then it returns the duration and the event fires once', async () => {
    const {engine} = await create(createConfig());
    const durations: Array<number | undefined> = [];
    eventbus.on('timeline-duration', getDuration => {
      durations.push(getDuration?.());
    });

    await engine.start();

    expect(durations).toEqual([10]);
  });

  test('given an init action and an active timeline action whose end operations start with selectElement, when the factory destroy() is awaited, then the end operations ran and the RAF clock stopped', async () => {
    const config = createConfig({
      initActions: [
        {
          id: 'init-1',
          name: 'AddInitElement',
          startOperations: [
            op('selectElement', {selector: '#stage'}),
            op('setElementContent', {
              template: '<div class="init-el"></div>',
              insertionType: 'append',
            }),
          ],
          endOperations: [
            op('selectElement', {selector: '.init-el'}),
            op('removeElement'),
          ],
        },
      ],
      timelines: [
        timeline('t1', 10, [
          {
            id: 'tl-1',
            name: 'AddTimelineElement',
            duration: {start: 0, end: 5},
            startOperations: [
              op('selectElement', {selector: '#stage'}),
              op('setElementContent', {
                template: '<span class="tl-el"></span>',
                insertionType: 'append',
              }),
            ],
            endOperations: [
              op('selectElement', {selector: '.tl-el'}),
              op('removeElement'),
              probe('tl-end'),
            ],
          },
        ]),
      ],
    });
    const {engine, destroy} = await create(config);
    await engine.start();
    await flush();
    expect($('.init-el').length).toBe(1);
    expect($('.tl-el').length).toBe(1);
    const signal = raf.signal;

    result = undefined;
    await expect(destroy()).resolves.toBeUndefined();

    expect(probes).toContain('tl-end');
    expect($('.tl-el').length).toBe(0);
    expect($('.init-el').length).toBe(0);
    expect(signal?.aborted).toBe(true);
  });

  test('given a DomContainerProvider in the settings, when the engine is initialised, then engine.container and the container request resolve to the element', async () => {
    const {engine} = await create(createConfig());

    expect(engine.container?.attr('id')).toBe('stage');
    expect(
      eventbus.request<JQuery>('timeline-container-request')?.attr('id')
    ).toBe('stage');
  });

  test('given two animation timelines of 10s and 20s, when switching to the 20s one, then engine.duration is 20 and seek(15) is accepted', async () => {
    const {engine} = await create(
      createConfig({timelines: [timeline('t1', 10), timeline('t2', 20)]})
    );

    await engine.switchTimeline('t2');

    expect(engine.duration).toBe(20);
    expect(await engine.seek(15)).toBe(15);
  });

  test('given a non-looping second timeline, when switchTimeline(uri, 5) is awaited, then the timeline plays from 5 with its covering actions started once', async () => {
    const {engine} = await create(
      createConfig({
        timelines: [
          timeline('t1', 10),
          timeline('t2', 20, [
            timelineAction('B', 4, 8),
            timelineAction('Z', 0, 1),
          ]),
        ],
      })
    );

    await engine.switchTimeline('t2', 5);

    expect(engine.playState).toBe('playing');
    expect(engine.position).toBe(5);
    expect(probes).toEqual(['B-start']);
  });

  test('given a looping second timeline, when switchTimeline(uri, 5) is awaited, then the position is honoured', async () => {
    const {engine} = await create(
      createConfig({
        timelines: [timeline('t1', 10), timeline('t2', 20, [], true)],
      })
    );

    await engine.switchTimeline('t2', 5);

    expect(engine.position).toBe(5);
    expect(engine.playState).toBe('playing');
  });

  test('given a playing timeline with a start-only action at 5, when seek(5) is called, then its start operations run exactly once', async () => {
    const {engine} = await create(
      createConfig({
        timelines: [timeline('t1', 10, [timelineAction('S', 5, 8, false)])],
      })
    );
    await engine.start();

    await engine.seek(5);
    await engine.seek(6);
    tick(200);

    expect(probes).toEqual(['S-start']);
  });

  test('given an action active at 0.5, when stop() is followed by start(), then the action is ended on stop and started again when its start is reached', async () => {
    const {engine} = await create(
      createConfig({
        timelines: [timeline('t1', 10, [timelineAction('A', 0.2, 5)])],
      })
    );
    await engine.start();
    tick(500);
    expect(probes).toEqual(['A-start']);

    await engine.stop();
    expect(probes).toEqual(['A-start', 'A-end']);

    await engine.start();
    tick(300);
    expect(probes).toEqual(['A-start', 'A-end', 'A-start']);
  });

  test('given a reused factory, when an engine with event actions is destroyed, then its event actions and interceptor are removed', async () => {
    const withEventAction = createConfig({
      eventActions: [
        {
          id: 'event-action-1',
          name: 'OnTrigger',
          eventName: 'probe-trigger',
          startOperations: [probe('event-action')],
        },
      ],
    });
    const first = await create(withEventAction);
    eventbus.broadcast('probe-trigger' as any, []);
    await flush();
    expect(probes).toEqual(['event-action']);

    result = undefined;
    await first.destroy();
    $('<div id="engine-root"></div>').appendTo(document.body);
    await create(createConfig());
    const before = countCalls(eventbus, 'before-request-timeline-uri');

    eventbus.broadcast('probe-trigger' as any, []);
    eventbus.broadcast('request-timeline-uri', ['unknown-uri']);
    await flush();

    expect(probes).toEqual(['event-action']);
    expect(before).toHaveBeenCalledTimes(1);
  });

  test('given a $ref locale entry, when the engine is initialised, then the referenced file is loaded into the locale manager', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({hello: 'Hallo'}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    const config = createConfig({
      locales: {
        'en-US': {hello: 'Hello'},
        'nl-NL': {$ref: '/locales/nl-NL.json'},
      },
    });

    const {localeManager} = await create(config);
    localeManager.setLocale('nl-NL');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localeManager.availableLocales).toContain('nl-NL');
    expect(localeManager.t('hello')).toBe('Hallo');
  });

  test('given a $ref locale entry that fails to load, when the engine is initialised, then init rejects naming the locale', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('missing', {status: 404}))
    );
    const config = createConfig({
      locales: {
        'en-US': {hello: 'Hello'},
        'nl-NL': {$ref: '/locales/nl-NL.json'},
      },
    });

    result = factory.createEngine(config);

    await expect(result.engine.init()).rejects.toThrow(/nl-NL/);
  });

  test('given a timeline action whose start operation fails, when the clock crosses its start, then the engine error event and engine-error are emitted once each and no rejection is unhandled', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const {engine} = await create(
        createConfig({
          timelines: [
            timeline('t1', 10, [
              {
                id: 'failing-action',
                name: 'Failing',
                duration: {start: 0.2, end: 5},
                // removeElement without a selected element throws
                startOperations: [op('removeElement')],
                endOperations: [],
              },
            ]),
          ],
        })
      );
      const engineErrors = vi.fn();
      engine.on('error', engineErrors);
      const eventbusErrors = countCalls(eventbus, 'engine-error');
      await engine.start();

      tick(300);
      await flush();
      await flush();

      expect(engineErrors).toHaveBeenCalledTimes(1);
      expect(eventbusErrors).toHaveBeenCalledTimes(1);
      const [error] = engineErrors.mock.calls[0];
      expect(eventbusErrors).toHaveBeenCalledWith(error);
      expect(error).toMatchObject({
        actionName: 'Failing',
        actionId: 'failing-action',
        phase: 'start',
      });
      expect(error.message).toContain("Error in action start 'Failing'");
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  test('given a controller added by an init action and never removed, when the factory destroy() is awaited, then the controller is detached and its eventbus listener is gone', async () => {
    const config = createConfig({
      locales: {'en-US': {hello: 'Hello'}},
      initActions: [
        {
          id: 'init-label',
          name: 'AddLabel',
          startOperations: [
            op('selectElement', {selector: '#stage'}),
            op('getControllerInstance', {systemName: 'LabelController'}),
            op('addControllerToElement', {translationKey: 'hello'}),
          ],
          endOperations: [],
        },
      ],
    });
    const {destroy} = await create(config);
    const [controller] = $('#stage').data('eligiusEngineControllers');
    expect(controller.name).toBe('LabelController');
    const detach = vi.spyOn(controller, 'detach');
    expect(controller.eventListeners).toHaveLength(1);

    result = undefined;
    await destroy();

    expect(detach).toHaveBeenCalledTimes(1);
    expect(detach).toHaveBeenCalledWith(eventbus);
    expect(controller.eventListeners).toHaveLength(0);
  });

  test('given two live engines, when one is destroyed and then the other, then global data survives the first destroy and is cleared after the last', async () => {
    const {setGlobals, getGlobals} = await import(
      '@operation/helper/globals.ts'
    );
    const first = await create(createConfig());
    result = undefined;
    $('<div id="engine-root-2"></div>').appendTo(document.body);
    const second = factory.createEngine(
      createConfig({containerSelector: '#engine-root-2'})
    );
    await second.engine.init();
    setGlobals({shared: 'value'});

    await first.destroy();
    const afterFirst = getGlobals('shared');
    await second.destroy();
    $('#engine-root-2').remove();

    expect(afterFirst).toBe('value');
    expect(getGlobals('shared')).toBeUndefined();
  });
});
