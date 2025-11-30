import type {IResolvedEngineConfiguration} from '@configuration/types.ts';
import {VideoJsTimelineProvider} from '@timelineproviders/video-js-timeline-provider.ts';
import $ from 'jquery';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type TestContext,
  test,
  vi,
} from 'vitest';

// Use vi.hoisted to define mock state that vi.mock can access
// This is the recommended pattern per Vitest docs:
// https://vitest.dev/api/vi#vi-hoisted
const mocks = vi.hoisted(() => {
  // Event handler storage - must be defined here so vi.mock can access it
  const eventHandlers = new Map<string, Array<(...args: any[]) => void>>();
  const oneHandlers = new Map<string, Array<(...args: any[]) => void>>();

  // Helper functions for triggering events
  const triggerEvent = (event: string, ...args: any[]) => {
    const handlers = eventHandlers.get(event) || [];
    handlers.forEach(h => h(...args));
  };

  const triggerOneEvent = (event: string, ...args: any[]) => {
    const handlers = oneHandlers.get(event) || [];
    handlers.forEach(h => h(...args));
    oneHandlers.set(event, []); // Clear after firing (one-time handlers)
  };

  const resetHandlers = () => {
    eventHandlers.clear();
    oneHandlers.clear();
  };

  // Create the mock player factory
  const createMockPlayer = () => ({
    play: vi.fn(),
    pause: vi.fn(),
    currentTime: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(60),
    load: vi.fn(),
    loop: false,
    one: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!oneHandlers.has(event)) {
        oneHandlers.set(event, []);
      }
      oneHandlers.get(event)!.push(handler);
    }),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event)!.push(handler);
    }),
    off: vi.fn(),
    selectSource: vi.fn(),
  });

  // The shared mock player instance
  let mockPlayer = createMockPlayer();

  return {
    eventHandlers,
    oneHandlers,
    triggerEvent,
    triggerOneEvent,
    resetHandlers,
    createMockPlayer,
    getMockPlayer: () => mockPlayer,
    resetMockPlayer: () => {
      mockPlayer = createMockPlayer();
      return mockPlayer;
    },
  };
});

// Mock video.js module - this is hoisted but can now access mocks via vi.hoisted
vi.mock('video.js', () => {
  const videojsFn = (
    _id: string,
    _options: any,
    readyCallback: () => void
  ): ReturnType<typeof mocks.createMockPlayer> => {
    const player = mocks.getMockPlayer();
    // Simulate the real videojs behavior - setTimeout then call ready callback
    // With fake timers, this won't fire until we explicitly advance time
    setTimeout(() => {
      readyCallback.call(player);
    }, 0);
    return player;
  };

  videojsFn.log = {
    level: vi.fn(),
  };

  return {
    default: videojsFn,
  };
});

function createMockConfiguration(
  overrides: Partial<IResolvedEngineConfiguration> = {}
): IResolvedEngineConfiguration {
  return {
    containerSelector: '#container',
    timelineProviderSettings: {
      mediaplayer: {
        selector: '#video-container',
      },
    },
    timelines: [
      {
        type: 'mediaplayer',
        uri: 'http://example.com/video.mp4',
        name: 'main',
        actions: [],
      },
    ],
    actions: [],
    labels: [],
    ...overrides,
  } as IResolvedEngineConfiguration;
}

type VideoJsTimelineProviderSuiteContext = {
  provider: VideoJsTimelineProvider;
  config: IResolvedEngineConfiguration;
  mockPlayer: ReturnType<typeof mocks.createMockPlayer>;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

/**
 * Helper to initialize a provider with fake timers.
 * Advances timers to trigger the videojs ready callback, then triggers canplay.
 */
async function initProvider(provider: VideoJsTimelineProvider): Promise<void> {
  const initPromise = provider.init();
  // Advance timers to fire the setTimeout(0) in videojs mock
  await vi.advanceTimersByTimeAsync(1);
  // Trigger canplay to resolve the init promise
  mocks.triggerOneEvent('canplay');
  await initPromise;
}

describe('VideoJsTimelineProvider', () => {
  beforeEach<VideoJsTimelineProviderSuiteContext>(context => {
    withContext<VideoJsTimelineProviderSuiteContext>(context);

    // Use fake timers for precise control over setTimeout
    vi.useFakeTimers();

    // Reset mock player and handlers before each test
    context.mockPlayer = mocks.resetMockPlayer();
    mocks.resetHandlers();

    // Create DOM elements
    $('<div id="video-container"/>').appendTo(document.body);

    context.config = createMockConfiguration();
    context.provider = new VideoJsTimelineProvider(context.config);
  });

  afterEach<VideoJsTimelineProviderSuiteContext>(() => {
    $('#video-container').remove();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test<VideoJsTimelineProviderSuiteContext>('should create provider with initial stopped state', context => {
    // given
    const {provider} = context;

    // expect
    expect(provider.playState).toBe('stopped');
    expect(provider.loop).toBe(false);
  });

  test<VideoJsTimelineProviderSuiteContext>('should initialize and create video element', async context => {
    // given
    const {provider} = context;

    // when
    await initProvider(provider);

    // expect
    const videoContainer = $('#video-container');
    expect(videoContainer.find('video').length).toBe(1);
  });

  test<VideoJsTimelineProviderSuiteContext>('should extract URLs from mediaplayer timelines only', async () => {
    // given
    const baseConfig = createMockConfiguration();
    const config = {
      ...baseConfig,
      timelines: [
        {
          type: 'mediaplayer',
          uri: 'http://example.com/video1.mp4',
          name: 'video1',
          actions: [],
        },
        {
          type: 'mediaplayer',
          uri: 'http://example.com/video2.webm',
          name: 'video2',
          actions: [],
        },
        {
          type: 'animation',
          duration: 10,
          name: 'animation',
          selector: '#animation-container',
          actions: [],
        },
      ],
    } as unknown as IResolvedEngineConfiguration;
    const provider = new VideoJsTimelineProvider(config);

    await initProvider(provider);

    // expect - video element should have sources for mp4 and webm, but not animation
    const videoHtml = $('#video-container').html();
    expect(videoHtml).toContain('video1.mp4');
    expect(videoHtml).toContain('video2.webm');
    expect(videoHtml).not.toContain('animation');
  });

  test<VideoJsTimelineProviderSuiteContext>('should start playback', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when
    provider.start();

    // expect
    expect(mockPlayer.play).toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should set playState to running when start is called', async context => {
    // given
    const {provider} = context;
    await initProvider(provider);
    expect(provider.playState).toBe('stopped');

    // when
    provider.start();

    // expect
    expect(provider.playState).toBe('running');
  });

  test<VideoJsTimelineProviderSuiteContext>('should pause playback', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when
    provider.pause();

    // expect
    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should set playState to stopped when pause is called', async context => {
    // given
    const {provider} = context;
    await initProvider(provider);
    provider.start();
    expect(provider.playState).toBe('running');

    // when
    provider.pause();

    // expect
    expect(provider.playState).toBe('stopped');
  });

  test<VideoJsTimelineProviderSuiteContext>('should stop playback and reset to beginning', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when
    provider.stop();

    // expect
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(mockPlayer.currentTime).toHaveBeenCalledWith(0);
  });

  test<VideoJsTimelineProviderSuiteContext>('should set playState to stopped when stop is called', async context => {
    // given
    const {provider} = context;
    await initProvider(provider);
    provider.start();
    expect(provider.playState).toBe('running');

    // when
    provider.stop();

    // expect
    expect(provider.playState).toBe('stopped');
  });

  test<VideoJsTimelineProviderSuiteContext>('should seek to position', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);
    mockPlayer.currentTime.mockReturnValue(30);

    // when
    const seekPromise = provider.seek(30);
    // Trigger seeked event
    mocks.triggerOneEvent('seeked');
    const result = await seekPromise;

    // expect
    expect(mockPlayer.currentTime).toHaveBeenCalledWith(30);
    expect(result).toBe(30);
  });

  test<VideoJsTimelineProviderSuiteContext>('should get current position', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);
    mockPlayer.currentTime.mockReturnValue(15.5);

    // when
    const position = provider.getPosition();

    // expect
    expect(position).toBe(15.5);
  });

  test<VideoJsTimelineProviderSuiteContext>('should return 0 when player not initialized', context => {
    // given
    const {provider} = context;

    // test - no init called
    const position = provider.getPosition();

    // expect
    expect(position).toBe(0);
  });

  test<VideoJsTimelineProviderSuiteContext>('should get duration', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);
    mockPlayer.duration.mockReturnValue(120);

    // when
    const duration = provider.getDuration();

    // expect
    expect(duration).toBe(120);
  });

  test<VideoJsTimelineProviderSuiteContext>('should return 0 duration when player not initialized', context => {
    // given
    const {provider} = context;

    // test - no init called
    const duration = provider.getDuration();

    // expect
    expect(duration).toBe(0);
  });

  test<VideoJsTimelineProviderSuiteContext>('should get container', context => {
    // given
    const {provider} = context;

    // test
    const container = provider.getContainer();

    // expect
    expect(container?.length).toBe(1);
    expect(container?.attr('id')).toBe('video-container');
  });

  test<VideoJsTimelineProviderSuiteContext>('should call onTime callback on timeupdate', async context => {
    // given
    const {provider, mockPlayer} = context;
    const timeCallback = vi.fn();
    await initProvider(provider);
    provider.onTime(timeCallback);

    // when - simulate timeupdate event
    mockPlayer.currentTime.mockReturnValue(5.5);
    mocks.triggerEvent('timeupdate');

    // expect
    expect(timeCallback).toHaveBeenCalledWith(5.5);
  });

  test<VideoJsTimelineProviderSuiteContext>('should call onComplete callback when video ends (non-looping)', async context => {
    // given
    const {provider, mockPlayer} = context;
    const completeCallback = vi.fn();
    await initProvider(provider);
    provider.onComplete(completeCallback);

    // when - simulate ended event (non-looping)
    mockPlayer.loop = false;
    mocks.triggerEvent('ended');

    // expect
    expect(completeCallback).toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should call onRestart when loop is enabled and video ends', async context => {
    // given
    const {provider, mockPlayer} = context;
    const restartCallback = vi.fn();
    const completeCallback = vi.fn();
    await initProvider(provider);
    provider.onRestart(restartCallback);
    provider.onComplete(completeCallback);

    // when - simulate ended event with loop enabled
    mockPlayer.loop = true;
    mocks.triggerEvent('ended');

    // expect
    expect(restartCallback).toHaveBeenCalled();
    expect(completeCallback).not.toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should call onFirstFrame callback on firstplay', async context => {
    // given
    const {provider} = context;
    const firstFrameCallback = vi.fn();
    provider.onFirstFrame(firstFrameCallback);

    // when - start init and trigger firstplay before canplay
    const initPromise = provider.init();
    await vi.advanceTimersByTimeAsync(1);
    mocks.triggerOneEvent('firstplay');
    mocks.triggerOneEvent('canplay');
    await initPromise;

    // expect
    expect(firstFrameCallback).toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should select playlist item when URI exists', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when
    provider.playlistItem('http://example.com/video.mp4');

    // expect
    expect(mockPlayer.selectSource).toHaveBeenCalledWith([
      'http://example.com/video.mp4',
    ]);
  });

  test<VideoJsTimelineProviderSuiteContext>('should throw error when playlist item URI does not exist', async context => {
    // given
    const {provider} = context;
    await initProvider(provider);

    // when/expect - should throw like RAF provider does
    expect(() =>
      provider.playlistItem('http://example.com/nonexistent.mp4')
    ).toThrow('Unknown playlist uri: http://example.com/nonexistent.mp4');
  });

  test<VideoJsTimelineProviderSuiteContext>('should destroy and clean up event handlers', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when
    provider.destroy();

    // expect - off should have been called for registered handlers
    expect(mockPlayer.off).toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should extract correct file type from URL', context => {
    // given
    const {provider} = context;

    // test - access private method for testing
    const extractFileType = (provider as any)._extractFileType.bind(provider);

    // expect
    expect(extractFileType('http://example.com/video.mp4')).toBe('video/mp4');
    expect(extractFileType('http://example.com/video.webm')).toBe('video/webm');
    expect(extractFileType('http://example.com/video.ogg')).toBe('video/ogg');
    expect(extractFileType('http://example.com/path/to/video.mov')).toBe(
      'video/mov'
    );
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle empty selector gracefully', context => {
    // given
    const config = createMockConfiguration({
      timelineProviderSettings: {
        mediaplayer: {
          selector: '',
        },
      },
    } as Partial<IResolvedEngineConfiguration>);
    const provider = new VideoJsTimelineProvider(config);

    // test
    const container = provider.getContainer();

    // expect - jQuery returns empty collection for empty selector
    expect(container?.length).toBe(0);
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle missing mediaplayer settings', context => {
    // given
    const config = createMockConfiguration({
      timelineProviderSettings: {},
    } as Partial<IResolvedEngineConfiguration>);
    const provider = new VideoJsTimelineProvider(config);

    // test
    const container = provider.getContainer();

    // expect - should handle undefined gracefully
    expect(container?.length).toBe(0);
  });

  test<VideoJsTimelineProviderSuiteContext>('should not call onTime when currentTime is undefined', async context => {
    // given
    const {provider, mockPlayer} = context;
    const timeCallback = vi.fn();
    await initProvider(provider);
    provider.onTime(timeCallback);

    // when - simulate timeupdate with undefined currentTime
    mockPlayer.currentTime.mockReturnValue(undefined);
    mocks.triggerEvent('timeupdate');

    // expect
    expect(timeCallback).not.toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle ended event when no callbacks registered', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when - no onComplete or onRestart registered
    mockPlayer.loop = false;

    // expect - should not throw
    expect(() => mocks.triggerEvent('ended')).not.toThrow();
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle timeupdate when no onTime callback registered', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when - no onTime registered
    mockPlayer.currentTime.mockReturnValue(5.0);

    // expect - should not throw
    expect(() => mocks.triggerEvent('timeupdate')).not.toThrow();
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle firstplay event when no callback registered', async context => {
    // given
    const {provider} = context;

    // when - start init and trigger firstplay (no callback registered)
    const initPromise = provider.init();
    await vi.advanceTimersByTimeAsync(1);

    // expect - should not throw (no onFirstFrame registered)
    expect(() => mocks.triggerOneEvent('firstplay')).not.toThrow();

    mocks.triggerOneEvent('canplay');
    await initPromise;
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle seek when player currentTime returns undefined', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when - mock currentTime to return undefined after seek
    mockPlayer.currentTime.mockReturnValue(undefined);
    const seekPromise = provider.seek(30);
    mocks.triggerOneEvent('seeked');
    const result = await seekPromise;

    // expect - should return 0 when currentTime returns undefined
    expect(result).toBe(0);
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle loop property on ended when loop is enabled but no restart callback', async context => {
    // given
    const {provider, mockPlayer} = context;
    const completeCallback = vi.fn();
    await initProvider(provider);

    // when - only onComplete registered, loop enabled
    provider.onComplete(completeCallback);
    mockPlayer.loop = true;
    mocks.triggerEvent('ended');

    // expect - onComplete should NOT be called when looping, even without restart callback
    expect(completeCallback).not.toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle start/stop/pause when player not initialized', context => {
    // given
    const {provider} = context;

    // test - these should not throw when player is undefined
    expect(() => provider.start()).not.toThrow();
    expect(() => provider.pause()).not.toThrow();
    expect(() => provider.stop()).not.toThrow();
  });

  test<VideoJsTimelineProviderSuiteContext>('should handle playlistItem when player not initialized', context => {
    // given
    const {provider} = context;

    // test - should not throw for valid URI (URI exists in config)
    expect(() =>
      provider.playlistItem('http://example.com/video.mp4')
    ).not.toThrow();
  });

  test<VideoJsTimelineProviderSuiteContext>('should return early when playlistItem called with empty URI', async context => {
    // given
    const {provider, mockPlayer} = context;
    await initProvider(provider);

    // when/expect - should not throw, should return early
    expect(() => provider.playlistItem('')).not.toThrow();
    expect(mockPlayer.selectSource).not.toHaveBeenCalled();
  });

  test<VideoJsTimelineProviderSuiteContext>('should return early when playlistItem called with no URLs configured', async () => {
    // given
    const config = createMockConfiguration({
      timelines: [], // No mediaplayer timelines
    });
    const provider = new VideoJsTimelineProvider(config);
    const initPromise = provider.init();
    await vi.advanceTimersByTimeAsync(1);
    mocks.triggerOneEvent('canplay');
    await initPromise;

    // when/expect - should not throw when no URLs configured
    expect(() =>
      provider.playlistItem('http://example.com/video.mp4')
    ).not.toThrow();
  });
});
