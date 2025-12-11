import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '@configuration/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import type {
  IContainerProvider,
  IPositionSource,
  ISeekable,
  TSourceState,
} from '@timelineproviders/types.ts';
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

function createMockPositionSource(): IPositionSource & ISeekable {
  return {
    state: 'inactive' as TSourceState,
    loop: false,
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    activate: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn(),
    deactivate: vi.fn(),
    getPosition: vi.fn().mockReturnValue(0),
    getDuration: vi.fn().mockReturnValue(100),
    onPosition: vi.fn(),
    onBoundaryReached: vi.fn(),
    onActivated: vi.fn(),
    seek: vi.fn().mockResolvedValue(0),
  };
}

function createMockContainerProvider(): IContainerProvider {
  return {
    getContainer: vi.fn().mockReturnValue({length: 1}),
    onContainerReady: vi.fn(),
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
        positionSource: {systemName: 'RafPositionSource'},
      },
    },
    containerSelector: '#app',
    language: 'en-US',
    layoutTemplate: '<div id="content"></div>',
    cssFiles: [],
    availableLanguages: [],
    initActions: [],
    actions: [],
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
  animationPositionSource: IPositionSource & ISeekable;
  mediaplayerPositionSource: IPositionSource & ISeekable;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<EngineSmokeTestContext>('EligiusEngine smoke tests', () => {
  beforeEach(context => {
    withContext<EngineSmokeTestContext>(context);

    context.eventbus = new Eventbus();
    context.languageManager = new LanguageManager('en-US', []);
    context.animationPositionSource = createMockPositionSource();
    context.mediaplayerPositionSource = createMockPositionSource();
    context.timelineProviders = {
      animation: {
        positionSource: context.animationPositionSource,
        containerProvider: createMockContainerProvider(),
      },
      mediaplayer: {
        positionSource: context.mediaplayerPositionSource,
        containerProvider: createMockContainerProvider(),
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
          type: 'mediaplayer', // Mediaplayer type configured but no mediaplayer provider
          duration: 100,
          loop: false,
          selector: '#content',
          timelineActions: [],
        } as IResolvedTimelineConfiguration,
      ],
    });

    // Only provide animation provider, not mediaplayer
    const incompleteProviders: Partial<
      Record<TimelineTypes, ITimelineProviderInfo>
    > = {
      animation: {
        positionSource: createMockPositionSource(),
        containerProvider: createMockContainerProvider(),
      },
    };

    const engine = new EligiusEngine(
      config,
      eventbus,
      incompleteProviders as Record<TimelineTypes, ITimelineProviderInfo>,
      languageManager
    );

    // test & expect
    await expect(engine.init()).rejects.toThrow(
      'No timeline provider configured for type mediaplayer'
    );
  });

  test<EngineSmokeTestContext>('should initialize successfully with valid configuration', async context => {
    // given
    const {
      eventbus,
      timelineProviders,
      languageManager,
      animationPositionSource,
    } = context;
    const config = createMinimalConfig();

    const engine = new EligiusEngine(
      config,
      eventbus,
      timelineProviders,
      languageManager
    );

    // test
    const positionSource = await engine.init();

    // expect
    expect(positionSource).toBeDefined();
    expect(animationPositionSource.init).toHaveBeenCalled();
    expect(animationPositionSource.onPosition).toHaveBeenCalled();
    expect(animationPositionSource.onBoundaryReached).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should respond to timeline-play-request event', async context => {
    // given
    const {
      eventbus,
      timelineProviders,
      languageManager,
      animationPositionSource,
    } = context;
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
    expect(animationPositionSource.activate).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should respond to timeline-pause-request event', async context => {
    // given
    const {
      eventbus,
      timelineProviders,
      languageManager,
      animationPositionSource,
    } = context;
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
    expect(animationPositionSource.suspend).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should respond to timeline-stop-request event', async context => {
    // given
    const {
      eventbus,
      timelineProviders,
      languageManager,
      animationPositionSource,
    } = context;
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
    expect(animationPositionSource.deactivate).toHaveBeenCalled();
  });

  test<EngineSmokeTestContext>('should cleanup properly on destroy', async context => {
    // given
    const {
      eventbus,
      timelineProviders,
      languageManager,
      animationPositionSource,
      mediaplayerPositionSource,
    } = context;
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
    expect(animationPositionSource.destroy).toHaveBeenCalled();
    expect(mediaplayerPositionSource.destroy).toHaveBeenCalled();
  });
});
