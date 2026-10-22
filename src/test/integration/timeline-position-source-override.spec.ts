import type {
  IEngineConfiguration,
  IOperationConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import type {TOperationData} from '@operation/types.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {ScrollPositionSource} from '@timelineproviders/position-sources/scroll-position-source.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactoryResult} from '@/types.ts';

/**
 * Per-timeline position source overrides, through EngineFactory with a real
 * Eventbus, the real adapters and real RAF and scroll position sources.
 * Only animationInterval is mocked, so the RAF clock is driven by hand with
 * jittered frame timestamps; scroll containers get a scrollable geometry and
 * are scrolled with a sequence of scroll events, like a smooth scroll.
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

/**
 * Delivers RAF frames to the active RAF session. `elapsed` is the time since
 * the session started, as animationInterval reports it.
 */
function frames(...elapsedMs: number[]) {
  for (const elapsed of elapsedMs) {
    if (raf.signal && !raf.signal.aborted) {
      raf.callback?.(elapsed);
    }
  }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/** scrollHeight - clientHeight of every scroll container in this spec */
const SCROLLABLE_HEIGHT = 1000;

/**
 * Gives a jsdom element a scrollable geometry. `scrollTo` moves the offset
 * and fires a scroll event, like an instant browser scroll.
 */
function makeScrollable(element: HTMLElement) {
  let scrollTop = 0;
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: SCROLLABLE_HEIGHT + 100,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: 100,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
  element.scrollTo = ((options: ScrollToOptions) => {
    scrollTop = options.top ?? scrollTop;
    element.dispatchEvent(new Event('scroll'));
  }) as typeof element.scrollTo;
}

/**
 * Scrolls the element by the user through each offset in turn, one scroll
 * event per offset.
 */
function userScroll(selector: string, ...offsets: number[]) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`no element ${selector}`);
  }
  for (const offset of offsets) {
    element.scrollTop = offset;
    element.dispatchEvent(new Event('scroll'));
  }
}

let opId = 0;
function op(
  systemName: string,
  operationData: TOperationData = {}
): IOperationConfiguration<TOperationData> {
  opId++;
  return {id: `op-${opId}`, systemName, operationData};
}

function timelineAction(
  name: string,
  start: number,
  end: number
): ITimelineActionConfiguration {
  return {
    id: `action-${name}`,
    name,
    duration: {start, end},
    startOperations: [
      op('broadcastEvent', {eventName: 'probe', eventArgs: [`${name}-start`]}),
    ],
    endOperations: [
      op('broadcastEvent', {eventName: 'probe', eventArgs: [`${name}-end`]}),
    ],
  };
}

function timeline(
  uri: string,
  duration: number,
  timelineActions: ITimelineActionConfiguration[],
  overrides: Partial<ITimelineConfiguration> = {}
): ITimelineConfiguration {
  return {
    id: uri,
    uri,
    type: 'animation',
    duration,
    loop: false,
    selector: '#stage',
    timelineActions,
    ...overrides,
  };
}

function createConfig(
  timelines: ITimelineConfiguration[],
  overrides: Partial<IEngineConfiguration> = {}
): IEngineConfiguration {
  return {
    id: 'timeline-source-override',
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
    timelines,
    ...overrides,
  };
}

describe('Per-timeline position source overrides (integration)', () => {
  let eventbus: Eventbus;
  let factory: EngineFactory;
  let result: IEngineFactoryResult | undefined;
  let probes: string[];

  beforeEach(() => {
    raf.callback = null;
    raf.signal = null;
    $('<div id="engine-root"></div>').appendTo(document.body);
    for (const id of ['scroll-a', 'scroll-b']) {
      const element = $(`<div id="${id}"></div>`)
        .appendTo(document.body)
        .get(0) as HTMLElement;
      makeScrollable(element);
    }
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
    $('#engine-root, #scroll-a, #scroll-b').remove();
  });

  async function create(config: IEngineConfiguration) {
    result = factory.createEngine(config);
    await result.engine.init();
    return result;
  }

  function takeProbes() {
    return probes.splice(0);
  }

  test('given a RAF intro and a scroll chapter in one configuration, when switching RAF -> Scroll -> RAF -> Scroll, then each timeline is driven by its own source and its actions start and end on it', async () => {
    const {engine} = await create(
      createConfig([
        timeline('intro', 10, [timelineAction('IntroA', 0.5, 2)]),
        timeline('chapter', 20, [timelineAction('ChapterA', 5, 15)], {
          positionSource: {
            systemName: 'ScrollPositionSource',
            selector: '#scroll-a',
          },
        }),
      ])
    );

    // RAF intro: jittered frames up to 0.6 s
    await engine.start();
    frames(99.2, 201.7, 298.9, 402.3, 500.6, 599.4);
    await flush();
    expect(engine.currentTimelineUri).toBe('intro');
    expect(engine.position).toBe(0.6);
    expect(takeProbes()).toEqual(['IntroA-start']);

    // -> Scroll chapter: the RAF clock stops, scrolling drives the timeline
    await engine.switchTimeline('chapter');
    await flush();
    expect(takeProbes()).toEqual(['IntroA-end']);
    expect(engine.currentTimelineUri).toBe('chapter');
    expect(raf.signal?.aborted).toBe(true);

    userScroll('#scroll-a', 60, 140, 230, 310, 420, 500);
    await flush();
    expect(engine.position).toBe(10);
    expect(takeProbes()).toEqual(['ChapterA-start']);

    // -> RAF intro at 1 s: the scroll source no longer drives the engine
    await engine.switchTimeline('intro', 1);
    await flush();
    expect(engine.currentTimelineUri).toBe('intro');
    expect(takeProbes()).toEqual(['ChapterA-end', 'IntroA-start']);

    userScroll('#scroll-a', 900);
    await flush();
    expect(engine.position).toBe(1);
    expect(takeProbes()).toEqual([]);

    frames(101.3, 198.8);
    await flush();
    expect(engine.position).toBe(1.2);

    // -> Scroll chapter again: it resumes at the current scroll offset (900
    // of 1000 px). The engine reconciles the first position after activation
    // like a seek, so ChapterA (5 to 15), which does not cover 18, is not
    // started and ended on the way there.
    await engine.switchTimeline('chapter');
    await flush();
    expect(engine.currentTimelineUri).toBe('chapter');
    expect(raf.signal?.aborted).toBe(true);
    expect(engine.position).toBe(18);
    expect(takeProbes()).toEqual(['IntroA-end']);

    userScroll('#scroll-a', 820, 700, 600);
    await flush();
    expect(engine.position).toBe(12);
    expect(takeProbes()).toEqual(['ChapterA-start']);

    frames(300);
    await flush();
    expect(engine.position).toBe(12);
  });

  test('given two scroll timelines on different containers, when switching between them, then each follows only its own container', async () => {
    const {engine} = await create(
      createConfig(
        [
          timeline('first', 10, [timelineAction('FirstA', 2, 8)], {
            positionSource: {selector: '#scroll-a'},
          }),
          timeline('second', 40, [timelineAction('SecondA', 10, 30)], {
            positionSource: {selector: '#scroll-b'},
          }),
        ],
        {
          timelineProviderSettings: {
            animation: {
              positionSource: {
                systemName: 'ScrollPositionSource',
                selector: '#scroll-default',
              },
            },
          },
        }
      )
    );
    await engine.start();

    userScroll('#scroll-a', 120, 250, 500);
    await flush();
    expect(engine.position).toBe(5);
    expect(takeProbes()).toEqual(['FirstA-start']);

    userScroll('#scroll-b', 500);
    await flush();
    expect(engine.position).toBe(5);

    await engine.switchTimeline('second');
    await flush();
    // second picks up the offset of its own container
    expect(engine.position).toBe(20);
    expect(takeProbes()).toEqual(['FirstA-end', 'SecondA-start']);

    userScroll('#scroll-a', 0);
    await flush();
    expect(engine.position).toBe(20);

    userScroll('#scroll-b', 600, 700, 800);
    await flush();
    expect(engine.position).toBe(32);
    expect(takeProbes()).toEqual(['SecondA-end']);

    await engine.switchTimeline('first');
    await flush();
    expect(engine.position).toBe(0);
    expect(takeProbes()).toEqual([]);
  });

  test('given a scroll timeline whose container was scrolled while it was inactive, when switching to it, then it starts at that offset without replaying the actions before it', async () => {
    const {engine} = await create(
      createConfig(
        [
          timeline('first', 10, [timelineAction('FirstA', 2, 8)], {
            positionSource: {selector: '#scroll-a'},
          }),
          timeline(
            'second',
            40,
            [
              timelineAction('SecondEarly', 2, 5),
              timelineAction('SecondA', 10, 30),
            ],
            {positionSource: {selector: '#scroll-b'}}
          ),
        ],
        {
          timelineProviderSettings: {
            animation: {
              positionSource: {
                systemName: 'ScrollPositionSource',
                selector: '#scroll-default',
              },
            },
          },
        }
      )
    );
    await engine.start();
    userScroll('#scroll-a', 250);
    await flush();
    takeProbes();

    // The user scrolls the second container while the first timeline plays
    userScroll('#scroll-b', 500);
    await flush();
    await engine.switchTimeline('second');
    await flush();

    expect(engine.position).toBe(20);
    expect(takeProbes()).toEqual(['FirstA-end', 'SecondA-start']);
  });

  test('given a RAF type default with tickInterval 250 and a timeline overriding only tickInterval, when switching to it, then it keeps the RAF class and the type container and ticks at its own interval', async () => {
    const created = await create(
      createConfig(
        [
          timeline('coarse', 10, []),
          timeline('fine', 10, [], {positionSource: {tickInterval: 50}}),
        ],
        {
          timelineProviderSettings: {
            animation: {
              positionSource: {
                systemName: 'RafPositionSource',
                tickInterval: 250,
              },
              container: {
                systemName: 'DomContainerProvider',
                selector: '#stage',
              },
            },
          },
        }
      )
    );
    const {engine} = created;

    await engine.start();
    frames(240, 510);
    await flush();
    expect(engine.position).toBe(0.5);

    await engine.switchTimeline('fine');
    frames(49.1, 101.2, 148.7);
    await flush();
    // the fine timeline ticks every 50 ms, so 0.15 is reachable
    expect(engine.currentTimelineUri).toBe('fine');
    expect(engine.position).toBe(0.15);
    expect(engine.container?.is('#stage')).toBe(true);
  });

  test('given a scroll override that changes only the selector of a scroll type, when created, then the merged source scrolls the overridden container with the type class', async () => {
    const config = createConfig(
      [
        timeline('one', 10, []),
        timeline('two', 10, [], {positionSource: {selector: '#scroll-b'}}),
      ],
      {
        timelineProviderSettings: {
          animation: {
            positionSource: {
              systemName: 'ScrollPositionSource',
              selector: '#scroll-a',
            },
          },
        },
      }
    );
    const created = await create(config);
    const {engine} = created;
    await engine.start();

    await engine.switchTimeline('two');
    userScroll('#scroll-b', 250);
    await flush();
    expect(engine.position).toBe(2.5);

    userScroll('#scroll-a', 900);
    await flush();
    expect(engine.position).toBe(2.5);
  });

  test('given a scroll override with a misspelt selector key, when the engine is created, then createEngine throws naming the JSON path', () => {
    expect(() =>
      factory.createEngine(
        createConfig([
          timeline('intro', 10, []),
          timeline('chapter', 10, [], {
            positionSource: {
              systemName: 'ScrollPositionSource',
              selecter: '#scroll-a',
            },
          }),
        ])
      )
    ).toThrowError(
      /^Missing setting at timelines\[1\]\.positionSource\.selector: 'ScrollPositionSource' requires 'selector'/
    );
  });

  test('given every timeline names its own source and there are no timelineProviderSettings, when the engine runs, then it uses those sources', async () => {
    const config = createConfig(
      [
        timeline('intro', 10, [timelineAction('IntroA', 0.2, 1)], {
          positionSource: {systemName: 'RafPositionSource'},
        }),
        timeline('chapter', 10, [], {
          positionSource: {
            systemName: 'ScrollPositionSource',
            selector: '#scroll-a',
          },
        }),
      ],
      {timelineProviderSettings: undefined}
    );
    const {engine} = await create(config);

    await engine.start();
    frames(100, 199.6, 301.1);
    await flush();
    expect(engine.position).toBe(0.3);
    expect(takeProbes()).toEqual(['IntroA-start']);

    await engine.switchTimeline('chapter');
    userScroll('#scroll-a', 300);
    await flush();
    expect(engine.position).toBe(3);
    expect(engine.container).toBeUndefined();
  });

  test('given the factory-built providers, when inspected, then the RAF and scroll timelines have sources of their own kinds', () => {
    result = factory.createEngine(
      createConfig([
        timeline('intro', 10, []),
        timeline('chapter', 20, [], {
          positionSource: {
            systemName: 'ScrollPositionSource',
            selector: '#scroll-a',
          },
        }),
      ])
    );
    const providers = (result.engine as any).timelineProvidersByUri;

    expect(providers.intro.positionSource).toBeInstanceOf(RafPositionSource);
    expect(providers.chapter.positionSource).toBeInstanceOf(
      ScrollPositionSource
    );
    expect(providers.chapter.positionSource.getDuration()).toBe(20);
    expect(providers.chapter.containerProvider).toBe(
      providers.intro.containerProvider
    );
  });
});
