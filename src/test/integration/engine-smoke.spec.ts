import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '@configuration/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import type {ITimelineProvider} from '@timelineproviders/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EligiusEngine} from '../../eligius-engine.ts';
import {LanguageManager} from '../../language-manager.ts';
import type {ITimelineProviderInfo, TimelineTypes} from '../../types.ts';

// Mock jQuery
vi.mock('jquery', () => {
  const mockElement = {
    length: 1,
    html: vi.fn(),
    empty: vi.fn(),
  };

  const jqueryFn = vi.fn((selector: string) => {
    if (selector === '#not-found') {
      return {length: 0, html: vi.fn(), empty: vi.fn()};
    }
    return mockElement;
  });

  return {default: jqueryFn};
});

function createMockTimelineProvider(): ITimelineProvider {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    start: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn().mockResolvedValue(0),
    destroy: vi.fn(),
    playlistItem: vi.fn(),
    getDuration: vi.fn().mockReturnValue(100),
    getPosition: vi.fn().mockReturnValue(0),
    getContainer: vi.fn(),
    onTime: vi.fn(),
    onComplete: vi.fn(),
    onFirstFrame: vi.fn(),
    onRestart: vi.fn(),
    loop: false,
    playState: 'idle' as const,
  };
}

function createMinimalConfig(
  overrides?: Partial<IResolvedEngineConfiguration>
): IResolvedEngineConfiguration {
  return {
    id: 'test-config',
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {
      animation: {
        id: 'raf-provider',
        systemName: 'RequestAnimationFrameTimelineProvider',
        vendor: 'eligius',
      },
    },
    containerSelector: '#app',
    language: 'en-US',
    layoutTemplate: '<div id="content"></div>',
    cssFiles: [],
    availableLanguages: ['en-US'],
    initActions: [],
    actions: [],
    eventActions: [],
    timelines: [
      {
        id: 'timeline-1',
        uri: 'timeline-1',
        type: 'animation',
        duration: 100,
        loop: false,
        selector: '#content',
        timelineActions: [],
      } as IResolvedTimelineConfiguration,
    ],
    timelineFlow: undefined,
    labels: [],
    ...overrides,
  };
}

type EngineSmokeTestContext = {
  eventbus: IEventbus;
  languageManager: LanguageManager;
  timelineProviders: Record<TimelineTypes, ITimelineProviderInfo>;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<EngineSmokeTestContext>('EligiusEngine smoke tests', () => {
  beforeEach(context => {
    withContext<EngineSmokeTestContext>(context);

    context.eventbus = new Eventbus();
    context.languageManager = new LanguageManager(
      'en-US',
      [],
      context.eventbus
    );
    context.timelineProviders = {
      animation: {
        id: 'raf-provider',
        vendor: 'eligius',
        provider: createMockTimelineProvider(),
      },
      video: {
        id: 'video-provider',
        vendor: 'eligius',
        provider: createMockTimelineProvider(),
      },
    };
  });

  test<EngineSmokeTestContext>('should create engine with minimal valid configuration', context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig();

    // test
    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );

    // expect
    expect(engine).toBeDefined();
  });

  test<EngineSmokeTestContext>('should throw error when container selector is not found', context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig({
      containerSelector: '#not-found',
    });

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );

    // test & expect - error is thrown synchronously during _createLayoutTemplate
    expect(() => engine.init()).toThrow(
      'Container selector not found: #not-found'
    );
  });

  test<EngineSmokeTestContext>('should throw error when no timelines are configured', async context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig({
      timelines: undefined as any, // Set to undefined to trigger the error path
    });

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );

    // test & expect
    await expect(engine.init()).rejects.toThrow('No timelines present');
  });

  test<EngineSmokeTestContext>('should throw error when timeline provider type is not configured', async context => {
    // given
    const {eventbus, languageManager} = context;
    const config = createMinimalConfig({
      timelines: [
        {
          id: 'timeline-1',
          uri: 'timeline-1',
          type: 'video', // Video type configured but no video provider
          duration: 100,
          loop: false,
          selector: '#content',
          timelineActions: [],
        } as IResolvedTimelineConfiguration,
      ],
    });

    // Only provide animation provider, not video
    const incompleteProviders = {
      animation: {
        id: 'raf-provider',
        vendor: 'eligius',
        provider: createMockTimelineProvider(),
      },
    } as Record<TimelineTypes, ITimelineProviderInfo>;

    const engine = new EligiusEngine(
      config,
      eventbus,
      incompleteProviders,
      languageManager
    );

    // test & expect
    await expect(engine.init()).rejects.toThrow(
      'No timeline provider configured for type video'
    );
  });

  test<EngineSmokeTestContext>('should initialize successfully with valid configuration', async context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig();

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );

    // test
    const provider = await engine.init();

    // expect
    expect(provider).toBeDefined();
    expect(timelineProviders.animation.provider.init).toHaveBeenCalled();
    expect(timelineProviders.animation.provider.onTime).toHaveBeenCalled();
    expect(timelineProviders.animation.provider.onComplete).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should respond to timeline-play-request event', async context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig();

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );
    await engine.init();

    // test
    eventbus.broadcast('timeline-play-request', []);

    // expect
    expect(timelineProviders.animation.provider.start).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should respond to timeline-pause-request event', async context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig();

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );
    await engine.init();

    // test
    eventbus.broadcast('timeline-pause-request', []);

    // expect
    expect(timelineProviders.animation.provider.pause).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should respond to timeline-stop-request event', async context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig();

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );
    await engine.init();

    // test
    eventbus.broadcast('timeline-stop-request', []);

    // expect
    expect(timelineProviders.animation.provider.stop).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should cleanup properly on destroy', async context => {
    // given
    const {eventbus, timelineProviders, languageManager} = context;
    const config = createMinimalConfig();

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );
    await engine.init();

    // test
    await engine.destroy();

    // expect
    expect(timelineProviders.animation.provider.destroy).toHaveBeenCalled();
    expect(timelineProviders.video.provider.destroy).toHaveBeenCalled();
  });
});
