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
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
    // A second live engine on the shared eventbus is warned about
    vi.spyOn(console, 'warn').mockImplementation(() => {});
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
  describe('overlapping commands, failures and several engines', () => {
    function failingTimelineAction(
      name: string,
      start: number,
      end: number
    ): ITimelineActionConfiguration {
      return {
        id: `action-${name}`,
        name,
        duration: {start, end},
        // removeElement without a selected element throws
        startOperations: [op('removeElement')],
        endOperations: [],
      };
    }

    test('given a playing engine, when a seek, a switch to a second timeline and another seek are requested back to back, then they run in order and end on the second timeline at the last position', async () => {
      const {engine} = await create(
        createConfig({
          timelines: [
            timeline('t1', 10, [timelineAction('A', 0, 10)]),
            timeline('t2', 20, [
              timelineAction('B', 4, 8),
              timelineAction('C', 1, 3),
            ]),
          ],
        })
      );
      await engine.start();
      tick(100);
      const seeked = countCalls(eventbus, 'timeline-seeked');

      eventbus.broadcast('timeline-seek-request', [5]);
      eventbus.broadcast('request-timeline-uri', ['t2', 6]);
      eventbus.broadcast('timeline-seek-request', [2]);
      await flush();
      await flush();

      expect(engine.currentTimelineUri).toBe('t2');
      expect(engine.position).toBe(2);
      expect(engine.playState).toBe('playing');
      expect(probes).toEqual([
        'A-start',
        'A-end',
        'B-start',
        'B-end',
        'C-start',
      ]);
      // The first seek is superseded by the last one
      expect(seeked).toHaveBeenCalledTimes(1);
    });

    test('given a switch whose new timeline is still initialising, when the factory destroy() is awaited, then the new timeline never starts and no RAF clock keeps running', async () => {
      const current = await create(
        createConfig({
          timelines: [
            timeline('t1', 10),
            timeline('t2', 10, [timelineAction('T2', 0, 10)]),
          ],
        })
      );
      await current.engine.start();

      const switching = current.engine.switchTimeline('t2');
      result = undefined;
      await current.destroy();
      await switching;
      await flush();
      tick(500);

      expect(probes).toEqual([]);
      expect(current.engine.playState).toBe('stopped');
      expect(raf.signal?.aborted).toBe(true);
    });

    test('given an action whose start fails and a healthy action covering the same position, when a seek is requested, then the seek completes, the healthy action starts and engine-error names the failing one', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const {engine} = await create(
        createConfig({
          timelines: [
            timeline('t1', 10, [
              failingTimelineAction('Failing', 3, 8),
              timelineAction('Healthy', 4, 9),
            ]),
          ],
        })
      );
      const engineErrors = countCalls(eventbus, 'engine-error');
      const seeked = countCalls(eventbus, 'timeline-seeked');

      eventbus.broadcast('timeline-seek-request', [5]);
      await flush();
      await flush();

      expect(probes).toEqual(['Healthy-start']);
      expect(seeked).toHaveBeenCalledTimes(1);
      expect(engineErrors).toHaveBeenCalledTimes(1);
      expect(engineErrors.mock.calls[0][0]).toMatchObject({
        actionName: 'Failing',
        phase: 'start',
      });
      expect(engine.position).toBe(5);
    });

    test('given two engines from one factory without a shared eventbus, when each runs its init action and a play request is broadcast on the first, then each resolves its own root, actions and commands', async () => {
      const ownFactory = new EngineFactory(
        new EligiusResourceImporter(),
        window
      );
      $('<div id="engine-root-2"></div>').appendTo(document.body);
      const markTitle = (className: string) => [
        {
          id: `init-${className}`,
          name: `Mark-${className}`,
          startOperations: [
            op('selectElement', {selector: '.title'}),
            op('addClass', {className}),
          ],
          endOperations: [],
        },
      ];
      const first = ownFactory.createEngine(
        createConfig({
          layoutTemplate: '<div id="stage"><div class="title"></div></div>',
          initActions: markTitle('marked-by-a'),
          actions: [
            {
              id: 'show-menu',
              name: 'ShowMenu',
              startOperations: [],
              endOperations: [],
            } as any,
          ],
        })
      );
      const second = ownFactory.createEngine(
        createConfig({
          containerSelector: '#engine-root-2',
          layoutTemplate: '<div id="stage-2"><div class="title"></div></div>',
          timelineProviderSettings: {
            animation: {
              positionSource: {
                systemName: 'RafPositionSource',
                tickInterval: 100,
              },
              container: {
                systemName: 'DomContainerProvider',
                selector: '#stage-2',
              },
            },
          },
          initActions: markTitle('marked-by-b'),
        })
      );
      try {
        await first.engine.init();
        await second.engine.init();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        first.eventbus.broadcast('timeline-play-request', []);
        await flush();

        expect(first.eventbus).not.toBe(second.eventbus);
        expect($('#engine-root .title').attr('class')).toBe(
          'title marked-by-a'
        );
        expect($('#engine-root-2 .title').attr('class')).toBe(
          'title marked-by-b'
        );
        expect(first.engine.playState).toBe('playing');
        expect(second.engine.playState).toBe('stopped');
        expect(
          first.eventbus.request<any>('request-action', 'ShowMenu')?.name
        ).toBe('ShowMenu');
        expect(() =>
          second.eventbus.request('request-action', 'ShowMenu')
        ).toThrow("Unknown action 'ShowMenu'");
        expect(first.eventbus.request<any>('request-engine-root')[0]).toBe(
          $('#engine-root')[0]
        );
        expect(second.eventbus.request<any>('request-engine-root')[0]).toBe(
          $('#engine-root-2')[0]
        );
      } finally {
        await first.destroy();
        await second.destroy();
        ownFactory.destroy();
        $('#engine-root-2').remove();
      }
    });

    test('given two live engines on a shared eventbus, when actions are requested, then each live engine answers for its own actions, newest first, and a destroyed engine no longer answers', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const first = await create(
        createConfig({
          actions: [
            {
              id: 'show-menu',
              name: 'ShowMenu',
              startOperations: [],
              endOperations: [],
            } as any,
          ],
        })
      );
      result = undefined;
      $('<div id="engine-root-2"></div>').appendTo(document.body);
      const second = factory.createEngine(
        createConfig({
          containerSelector: '#engine-root-2',
          actions: [
            {
              id: 'show-info',
              name: 'ShowInfo',
              startOperations: [],
              endOperations: [],
            } as any,
          ],
        })
      );
      try {
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('second live engine on a shared eventbus')
        );
        expect(eventbus.request<any>('request-action', 'ShowMenu')?.name).toBe(
          'ShowMenu'
        );
        expect(eventbus.request<any>('request-action', 'ShowInfo')?.name).toBe(
          'ShowInfo'
        );

        await second.destroy();

        expect(() => eventbus.request('request-action', 'ShowInfo')).toThrow(
          "Unknown action 'ShowInfo'"
        );
        expect(eventbus.request<any>('request-action', 'ShowMenu')?.name).toBe(
          'ShowMenu'
        );
      } finally {
        await second.destroy();
        await first.destroy();
        $('#engine-root-2').remove();
      }
    });

    test('given an engine option that makes the engine constructor throw, when createEngine throws, then its event action, interceptor and registrations are removed again', () => {
      const failingFactory = new EngineFactory(
        new EligiusResourceImporter(),
        window,
        {eventbus, engineOptions: {maxCatchUp: 0}}
      );
      const removersBefore = trackedRegistrations(failingFactory);
      const config = createConfig({
        eventActions: [
          {
            id: 'event-action-1',
            name: 'OnTrigger',
            eventName: 'probe-trigger',
            startOperations: [probe('event-action')],
          },
        ],
      });

      try {
        expect(() => failingFactory.createEngine(config)).toThrow(/maxCatchUp/);

        const before = countCalls(eventbus, 'before-request-timeline-uri');
        eventbus.broadcast('probe-trigger' as any, []);
        eventbus.broadcast('request-timeline-uri', ['t1']);
        expect(probes).toEqual([]);
        expect(before).not.toHaveBeenCalled();
        expect(trackedRegistrations(failingFactory)).toBe(removersBefore);
      } finally {
        failingFactory.destroy();
      }
    });

    test('given a configuration whose event action name duplicates an action name, when createEngine throws, then neither the event action nor an interceptor is left on the eventbus', () => {
      const removersBefore = trackedRegistrations(factory);
      const config = createConfig({
        actions: [
          {
            id: 'dup-action',
            name: 'Dup',
            startOperations: [],
            endOperations: [],
          } as any,
        ],
        eventActions: [
          {
            id: 'dup-event-action',
            name: 'Dup',
            eventName: 'probe-trigger',
            startOperations: [probe('event-action')],
          },
        ],
      });

      expect(() => factory.createEngine(config)).toThrow(/Duplicate action/);

      const before = countCalls(eventbus, 'before-request-timeline-uri');
      eventbus.broadcast('probe-trigger' as any, []);
      eventbus.broadcast('request-timeline-uri', ['t1']);
      expect(probes).toEqual([]);
      expect(before).not.toHaveBeenCalled();
      expect(trackedRegistrations(factory)).toBe(removersBefore);
    });

    test('given a reused factory, when engines are created and destroyed, then the factory does not keep their eventbus registrations', async () => {
      const removersBefore = trackedRegistrations(factory);

      for (let i = 0; i < 3; i++) {
        const created = await create(
          createConfig({
            eventActions: [
              {
                id: `event-action-${i}`,
                name: `OnTrigger${i}`,
                eventName: 'probe-trigger',
                startOperations: [probe('event-action')],
              },
            ],
          })
        );
        result = undefined;
        await created.destroy();
      }

      expect(trackedRegistrations(factory)).toBe(removersBefore);
    });

    test('given an init action with end operations, when the factory destroy() is called twice, then the end operations run once and both calls resolve', async () => {
      const config = createConfig({
        initActions: [
          {
            id: 'init-probe',
            name: 'InitProbe',
            startOperations: [probe('init-start')],
            endOperations: [probe('init-end')],
          },
        ],
      });
      const created = await create(config);
      result = undefined;

      await Promise.all([created.destroy(), created.destroy()]);
      await created.destroy();

      expect(probes).toEqual(['init-start', 'init-end']);
    });
  });

  describe('teardown of module state, pending loads and failed creation', () => {
    test('given an initialised factory engine, when request-engine-root is requested twice, then both answers are the cached engineRoot instance', async () => {
      const {engine} = await create(createConfig());

      const first = eventbus.request('request-engine-root');
      const second = eventbus.request('request-engine-root');

      expect(first).toBe(engine.engineRoot);
      expect(second).toBe(first);
    });

    test('given loadJson cached a response, when the last live engine is destroyed, then the next cached loadJson fetches again', async () => {
      const {loadJson} = await import('@operation/load-json.ts');
      const fetchMock = vi.fn(
        async () =>
          new Response(JSON.stringify({value: 1}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
          })
      );
      vi.stubGlobal('fetch', fetchMock);
      const created = await create(createConfig());
      result = undefined;
      const scope = {eventbus} as any;
      await loadJson.call(scope, {url: '/data.json', cache: true});
      await loadJson.call(scope, {url: '/data.json', cache: true});
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await created.destroy();
      await loadJson.call(scope, {url: '/data.json', cache: true});

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('given a $ref locale whose fetch is still pending, when the engine is destroyed, then the fetch is aborted, init rejects and the locale is never loaded', async () => {
      let fetchSignal: AbortSignal | undefined;
      let respond: (response: Response) => void = () => {};
      vi.stubGlobal(
        'fetch',
        vi.fn((_url: string, init?: RequestInit) => {
          fetchSignal = init?.signal ?? undefined;
          return new Promise<Response>(resolve => {
            respond = resolve;
          });
        })
      );
      const config = createConfig({
        locales: {
          'en-US': {hello: 'Hello'},
          'nl-NL': {$ref: '/locales/nl-NL.json'},
        },
      });
      const created = factory.createEngine(config);
      result = undefined;
      const loadLocale = vi.spyOn(created.localeManager, 'loadLocale');
      const init = created.engine.init();
      init.catch(() => {});
      await flush();
      expect(fetchSignal).toBeDefined();
      expect(fetchSignal?.aborted).toBe(false);

      await created.destroy();
      respond(
        new Response(JSON.stringify({hello: 'Hallo'}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        })
      );
      await flush();

      expect(fetchSignal?.aborted).toBe(true);
      await expect(init).rejects.toThrow();
      expect(loadLocale).not.toHaveBeenCalled();
    });

    test('given the engine was destroyed directly instead of through the factory result, when a $ref locale fetch is pending, then the fetch is aborted', async () => {
      let fetchSignal: AbortSignal | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn((_url: string, init?: RequestInit) => {
          fetchSignal = init?.signal ?? undefined;
          return new Promise<Response>(() => {});
        })
      );
      const created = factory.createEngine(
        createConfig({
          locales: {
            'en-US': {hello: 'Hello'},
            'nl-NL': {$ref: '/locales/nl-NL.json'},
          },
        })
      );
      result = created;
      created.engine.init().catch(() => {});
      await flush();

      await created.engine.destroy();

      expect(fetchSignal?.aborted).toBe(true);
    });

    test('given an adapter whose connect() throws, when createEngine throws, then the adapters connected before it and every registration are removed again', async () => {
      const {EngineInputAdapter} = await import('@adapters/index.ts');
      vi.spyOn(EngineInputAdapter.prototype, 'connect').mockImplementation(
        () => {
          throw new Error('connect failed');
        }
      );
      const removersBefore = trackedRegistrations(factory);
      const playRequests = vi.fn();

      expect(() => factory.createEngine(createConfig())).toThrow(
        'connect failed'
      );

      eventbus.on('timeline-play', playRequests);
      eventbus.broadcast('timeline-play-request', []);
      expect(playRequests).not.toHaveBeenCalled();
      expect(eventbus.request('request-engine-root')).toBeUndefined();
      expect(trackedRegistrations(factory)).toBe(removersBefore);
    });

    test('given a pending $ref locale load, when createEngine throws afterwards, then the load is aborted', async () => {
      let fetchSignal: AbortSignal | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn((_url: string, init?: RequestInit) => {
          fetchSignal = init?.signal ?? undefined;
          return new Promise<Response>(() => {});
        })
      );
      const failingFactory = new EngineFactory(
        new EligiusResourceImporter(),
        window,
        {eventbus, engineOptions: {maxCatchUp: 0}}
      );
      try {
        expect(() =>
          failingFactory.createEngine(
            createConfig({
              locales: {
                'en-US': {hello: 'Hello'},
                'nl-NL': {$ref: '/locales/nl-NL.json'},
              },
            })
          )
        ).toThrow(/maxCatchUp/);
        await flush();

        expect(fetchSignal?.aborted).toBe(true);
      } finally {
        failingFactory.destroy();
      }
    });

    test('given an engine with action ShowMenu, when request-action asks for ShowMneu, then it throws a did-you-mean hint and requestAction keeps it', async () => {
      const {requestAction} = await import('@operation/request-action.ts');
      await create(
        createConfig({
          actions: [
            {
              id: 'show-menu',
              name: 'ShowMenu',
              startOperations: [],
              endOperations: [],
            } as any,
          ],
        })
      );

      expect(() => eventbus.request('request-action', 'ShowMneu')).toThrow(
        "Unknown action 'ShowMneu'. Did you mean 'ShowMenu'?"
      );
      expect(() =>
        requestAction.call({eventbus} as any, {systemName: 'ShowMneu'})
      ).toThrow(
        "requestAction: could not retrieve action 'ShowMneu'. Unknown action 'ShowMneu'. Did you mean 'ShowMenu'?"
      );
    });
  });

  /** Number of eventbus registrations the factory still tracks */
  function trackedRegistrations(target: EngineFactory): number {
    const removers = (target as any)._eventRemovers;
    return removers.size ?? removers.length;
  }

  describe('audit gaps: direct destroy, failed creation, several engines, async starts and large jumps', () => {
    const showMenu = {
      id: 'show-menu',
      name: 'ShowMenu',
      startOperations: [],
      endOperations: [],
    } as any;

    test('given a factory-created engine, when it is destroyed with engine.destroy() instead of the factory destroy(), then its resize listener and eventbus registrations are removed and the live engine count drops once', async () => {
      const {setGlobals, getGlobals} = await import(
        '@operation/helper/globals.ts'
      );
      const removeListener = vi.spyOn(window, 'removeEventListener');
      const removersBefore = trackedRegistrations(factory);
      const created = await create(createConfig({actions: [showMenu]}));
      result = undefined;
      setGlobals({shared: 'value'});
      expect(trackedRegistrations(factory)).toBeGreaterThan(removersBefore);

      await created.engine.destroy();
      await flush();

      expect(
        removeListener.mock.calls.some(([type]) => type === 'resize')
      ).toBe(true);
      expect(trackedRegistrations(factory)).toBe(removersBefore);
      // It was the last live engine
      expect(getGlobals('shared')).toBeUndefined();
      expect(() => eventbus.request('request-action', 'ShowMenu')).toThrow(
        "Unknown action 'ShowMenu'"
      );

      // A new engine is not warned about as a second live engine, and the
      // factory destroy() of the destroyed engine does not count it again.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await create(createConfig());
      setGlobals({shared: 'second'});
      await created.destroy();

      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('second live engine')
      );
      expect(getGlobals('shared')).toBe('second');
    });

    test('given a configuration whose resolver throws on an unknown operation, when createEngine is retried with a valid configuration on the same factory, then only the retried engine answers events and interceptors', async () => {
      // EngineEventbusAdapter logs the switch to the unknown URI
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const removersBefore = trackedRegistrations(factory);
      const eventAction = (name: string) => ({
        id: `event-action-${name}`,
        name,
        eventName: 'probe-trigger',
        startOperations: [probe(name)],
      });

      expect(() =>
        factory.createEngine(
          createConfig({
            eventActions: [eventAction('Broken')],
            timelines: [
              timeline('t1', 10, [
                {
                  id: 'unknown-op-action',
                  name: 'UnknownOp',
                  duration: {start: 0, end: 1},
                  startOperations: [op('noSuchOperation')],
                  endOperations: [],
                },
              ]),
            ],
          })
        )
      ).toThrow(/noSuchOperation/);
      expect(trackedRegistrations(factory)).toBe(removersBefore);

      await create(createConfig({eventActions: [eventAction('Retried')]}));
      const before = countCalls(eventbus, 'before-request-timeline-uri');
      eventbus.broadcast('probe-trigger' as any, []);
      eventbus.broadcast('request-timeline-uri', ['unknown-uri']);
      await flush();

      expect(probes).toEqual(['Retried']);
      expect(before).toHaveBeenCalledTimes(1);
    });

    test('given an action whose end operation fails and no engine-error listener, when the clock crosses its end, then the engine logs the error message with its cause once', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const {engine} = await create(
        createConfig({
          timelines: [
            timeline('t1', 10, [
              {
                id: 'failing-end',
                name: 'FailingEnd',
                duration: {start: 0.2, end: 0.4},
                startOperations: [probe('FailingEnd-start')],
                // removeElement without a selected element throws
                endOperations: [op('removeElement')],
              },
            ]),
          ],
        })
      );
      await engine.start();

      tick(300);
      tick(500);
      await flush();
      await flush();

      expect(probes).toEqual(['FailingEnd-start']);
      const logged = consoleError.mock.calls.filter(
        ([message]) =>
          typeof message === 'string' &&
          message.startsWith("Error in action end 'FailingEnd'")
      );
      expect(logged).toHaveLength(1);
      expect(logged[0][0]).toContain("at operation 'removeElement'");
      expect(logged[0][1]).toBeInstanceOf(Error);
    });

    test('given two engines from one factory without a shared eventbus, when translations, elements and actions are requested on the second engine, then they resolve against the second engine', async () => {
      const ownFactory = new EngineFactory(
        new EligiusResourceImporter(),
        window
      );
      $('<div id="engine-root-2"></div>').appendTo(document.body);
      const first = ownFactory.createEngine(
        createConfig({
          layoutTemplate: '<div id="stage"><p class="title">A</p></div>',
          locales: {'en-US': {greeting: 'Hello from A'}},
          actions: [showMenu],
        })
      );
      const second = ownFactory.createEngine(
        createConfig({
          containerSelector: '#engine-root-2',
          layoutTemplate: '<div id="stage-2"><p class="title">B</p></div>',
          locales: {'en-US': {greeting: 'Hello from B'}},
          timelineProviderSettings: {
            animation: {
              positionSource: {
                systemName: 'RafPositionSource',
                tickInterval: 100,
              },
              container: {
                systemName: 'DomContainerProvider',
                selector: '#stage-2',
              },
            },
          },
          actions: [{...showMenu, id: 'show-info', name: 'ShowInfo'}],
        })
      );
      try {
        await first.engine.init();
        await second.engine.init();
        const {selectElement} = await import('@operation/select-element.ts');

        const selected = selectElement.call(
          {eventbus: second.eventbus} as any,
          {selector: '.title'} as any
        ) as any;

        expect(second.eventbus.request('request-translation', 'greeting')).toBe(
          'Hello from B'
        );
        expect(first.eventbus.request('request-translation', 'greeting')).toBe(
          'Hello from A'
        );
        expect(selected.selectedElement.text()).toBe('B');
        expect(
          second.eventbus.request<any>('request-action', 'ShowInfo')?.name
        ).toBe('ShowInfo');
        expect(() =>
          second.eventbus.request('request-action', 'ShowMenu')
        ).toThrow("Unknown action 'ShowMenu'");
      } finally {
        await first.destroy();
        await second.destroy();
        ownFactory.destroy();
        $('#engine-root-2').remove();
      }
    });

    test('given an action whose start operation awaits a fetch, when the clock passes its start and its end before the fetch settles, then other actions are not held up and its end operations run after its start operations', async () => {
      let respond: (response: Response) => void = () => {};
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise<Response>(resolve => {
              respond = resolve;
            })
        )
      );
      const {engine} = await create(
        createConfig({
          timelines: [
            timeline('t1', 10, [
              {
                id: 'action-Fetching',
                name: 'Fetching',
                duration: {start: 0.2, end: 0.4},
                startOperations: [
                  op('loadJson', {url: '/data/chapter.json'}),
                  probe('Fetching-start'),
                ],
                endOperations: [probe('Fetching-end')],
              },
              timelineAction('Other', 0.3, 5),
            ]),
          ],
        })
      );
      await engine.start();

      tick(300);
      tick(500);
      await flush();

      expect(probes).toEqual(['Other-start']);

      respond(
        new Response(JSON.stringify({title: 'Chapter'}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        })
      );
      await flush();
      await flush();

      expect(probes).toEqual(['Other-start', 'Fetching-start', 'Fetching-end']);
    });

    function shortActions(count: number) {
      return Array.from({length: count}, (_, index) =>
        timelineAction(`S${index}`, index + 0.5, index + 0.7)
      );
    }

    test('given 40 short actions on a 60s timeline, when a background tab resumes and one frame jumps from 0.1 to 45, then every skipped action starts and ends exactly once, in order, within that frame', async () => {
      const {engine} = await create(
        createConfig({
          timelines: [timeline('t1', 60, shortActions(40))],
        })
      );
      await engine.start();
      tick(100);

      tick(45000);
      const inFrame = [...probes];

      expect(engine.position).toBe(45);
      expect(inFrame).toHaveLength(80);
      expect(inFrame).toEqual(
        Array.from({length: 40}, (_, index) => [
          `S${index}-start`,
          `S${index}-end`,
        ]).flat()
      );
      await flush();
      expect(probes).toEqual(inFrame);
    });

    test('given maxCatchUp of 2 seconds, when one frame jumps from 0.1 to 45, then the frame only starts the action covering 45', async () => {
      const catchUpFactory = new EngineFactory(
        new EligiusResourceImporter(),
        window,
        {eventbus, engineOptions: {maxCatchUp: 2}}
      );
      const created = catchUpFactory.createEngine(
        createConfig({
          timelines: [
            timeline('t1', 60, [
              ...shortActions(40),
              timelineAction('Covering', 44, 50),
            ]),
          ],
        })
      );
      try {
        await created.engine.init();
        await created.engine.start();
        tick(100);

        tick(45000);

        expect(created.engine.position).toBe(45);
        expect(probes).toEqual(['Covering-start']);
      } finally {
        await created.destroy();
        catchUpFactory.destroy();
      }
    });
  });
});
