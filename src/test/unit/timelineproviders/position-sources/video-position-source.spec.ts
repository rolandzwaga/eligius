import type {TBoundary} from '@timelineproviders/types.ts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type Mock,
  type TestContext,
  test,
  vi,
} from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// vi.hoisted() pattern for video.js mocking
// ─────────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  // Event handler storage
  const eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const oneHandlers = new Map<string, Array<(...args: unknown[]) => void>>();

  // Helper to trigger registered event handlers from tests
  const triggerEvent = (event: string, ...args: unknown[]) => {
    const handlers = eventHandlers.get(event) || [];
    for (const h of handlers) {
      h(...args);
    }
  };

  // Helper for one-time handlers (like video.js .one())
  const triggerOneEvent = (event: string, ...args: unknown[]) => {
    const handlers = oneHandlers.get(event) || [];
    for (const h of handlers) {
      h(...args);
    }
    oneHandlers.set(event, []); // Clear after firing
  };

  // Reset function for beforeEach
  const resetHandlers = () => {
    eventHandlers.clear();
    oneHandlers.clear();
  };

  // Mock player factory
  const createMockPlayer = () => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    currentTime: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(60),
    load: vi.fn(),
    loop: false,
    one: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!oneHandlers.has(event)) oneHandlers.set(event, []);
      oneHandlers.get(event)!.push(handler);
    }),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!eventHandlers.has(event)) eventHandlers.set(event, []);
      eventHandlers.get(event)!.push(handler);
    }),
    off: vi.fn((event: string, handler?: (...args: unknown[]) => void) => {
      if (handler) {
        const handlers = eventHandlers.get(event);
        if (handlers) {
          const idx = handlers.indexOf(handler);
          if (idx >= 0) handlers.splice(idx, 1);
        }
      } else {
        eventHandlers.delete(event);
      }
    }),
    el: vi.fn().mockReturnValue(document.createElement('div')),
  });

  let mockPlayer = createMockPlayer();
  let videojsCallCount = 0;
  let videojsError: Error | null = null;

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
      videojsCallCount = 0;
      videojsError = null;
      return mockPlayer;
    },
    recordVideojsCall: () => {
      videojsCallCount++;
      if (videojsError) {
        throw videojsError;
      }
    },
    getVideojsCallCount: () => videojsCallCount,
    setVideojsError: (error: Error | null) => {
      videojsError = error;
    },
  };
});

// One shared video.js module object, so a test that swaps the mock with
// vi.doMock can restore exactly the same module afterwards.
const videojsModule = vi.hoisted(() => {
  const videojsFn = (
    _elementOrId: string | HTMLElement,
    _options: Record<string, unknown>,
    readyCallback?: () => void
  ) => {
    mocks.recordVideojsCall();
    const player = mocks.getMockPlayer();
    if (readyCallback) {
      // Call ready callback asynchronously, binding player as `this`
      setTimeout(() => readyCallback.call(player), 0);
    }
    return player;
  };
  videojsFn.log = {level: vi.fn()};
  return {factory: () => ({default: videojsFn})};
});

// VideoPositionSource loads video.js with a dynamic import(); vi.mock covers it
vi.mock('video.js', videojsModule.factory);

// Import after mock setup
import {VideoPositionSource} from '@timelineproviders/position-sources/video-position-source.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type VideoPositionSourceTestContext = {
  source: VideoPositionSource;
  mockPlayer: ReturnType<typeof mocks.createMockPlayer>;
  positionCallback: Mock<(position: number) => void>;
  boundaryCallback: Mock<(boundary: TBoundary) => void>;
  containerReadyCallback: Mock<() => void>;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource', () => {
  beforeEach<VideoPositionSourceTestContext>(context => {
    vi.useFakeTimers();

    // Reset mocks
    context.mockPlayer = mocks.resetMockPlayer();
    mocks.resetHandlers();

    // The source rejects init when its container is missing
    const container = document.createElement('div');
    container.id = 'video-container';
    document.body.appendChild(container);

    // Create source with mock configuration
    context.source = new VideoPositionSource({
      selector: '#video-container',
      sources: [{src: 'video.mp4', type: 'video/mp4'}],
    });

    context.positionCallback = vi.fn();
    context.boundaryCallback = vi.fn();
    context.containerReadyCallback = vi.fn();
  });

  afterEach(() => {
    document.getElementById('video-container')?.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T016: Initialization and video.js setup tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('initialization and video.js setup (T016)', () => {
    test<VideoPositionSourceTestContext>('should start in inactive state', ({
      source,
    }) => {
      expect(source.state).toBe('inactive');
    });

    test<VideoPositionSourceTestContext>('should have position 0 initially', ({
      source,
    }) => {
      expect(source.getPosition()).toBe(0);
    });

    test<VideoPositionSourceTestContext>('should initialize video.js player on init()', async ({
      source,
    }) => {
      const initPromise = source.init();

      // Advance timers to trigger the ready callback
      await vi.advanceTimersByTimeAsync(10);

      // Trigger canplay event
      mocks.triggerOneEvent('canplay');

      await initPromise;

      // Player should be initialized
      expect(source.state).toBe('inactive');
    });

    test<VideoPositionSourceTestContext>('should register event handlers on init()', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      // Should have registered timeupdate and ended handlers
      expect(mockPlayer.on).toHaveBeenCalledWith(
        'timeupdate',
        expect.any(Function)
      );
      expect(mockPlayer.on).toHaveBeenCalledWith('ended', expect.any(Function));
    });

    test<VideoPositionSourceTestContext>('should get duration from video.js player', async ({
      source,
      mockPlayer,
    }) => {
      mockPlayer.duration.mockReturnValue(120);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      expect(source.getDuration()).toBe(120);
    });

    test<VideoPositionSourceTestContext>('should trigger container ready on first frame', async ({
      source,
      containerReadyCallback,
    }) => {
      source.onContainerReady(containerReadyCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      // video.js 8 has no player 'firstplay' event; first 'playing' marks readiness
      mocks.triggerOneEvent('playing');

      expect(containerReadyCallback).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T017: State transitions tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('state transitions (T017)', () => {
    test<VideoPositionSourceTestContext>('activate() should transition to active state', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      expect(source.state).toBe('active');
    });

    test<VideoPositionSourceTestContext>('activate() should call player.play()', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      expect(mockPlayer.play).toHaveBeenCalled();
    });

    test<VideoPositionSourceTestContext>('suspend() should transition to suspended state', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      source.suspend();

      expect(source.state).toBe('suspended');
    });

    test<VideoPositionSourceTestContext>('suspend() should call player.pause()', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      source.suspend();

      expect(mockPlayer.pause).toHaveBeenCalled();
    });

    test<VideoPositionSourceTestContext>('suspend() should preserve position', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Simulate position update
      mockPlayer.currentTime.mockReturnValue(30);
      mocks.triggerEvent('timeupdate');

      source.suspend();

      expect(source.getPosition()).toBe(30);
    });

    test<VideoPositionSourceTestContext>('deactivate() should transition to inactive state', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      source.deactivate();

      expect(source.state).toBe('inactive');
    });

    test<VideoPositionSourceTestContext>('deactivate() should reset position to 0', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Simulate position update
      mockPlayer.currentTime.mockReturnValue(30);
      mocks.triggerEvent('timeupdate');

      source.deactivate();

      // Should reset currentTime to 0
      expect(mockPlayer.currentTime).toHaveBeenCalledWith(0);
    });

    test<VideoPositionSourceTestContext>('resume from suspended should call play()', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      source.suspend();

      mockPlayer.play.mockClear();
      await source.activate();

      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T018: Position updates from timeupdate event tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('position updates from timeupdate event (T018)', () => {
    test<VideoPositionSourceTestContext>('should emit position updates on timeupdate', async ({
      source,
      positionCallback,
      mockPlayer,
    }) => {
      source.onPosition(positionCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Simulate timeupdate events
      mockPlayer.currentTime.mockReturnValue(5);
      mocks.triggerEvent('timeupdate');

      expect(positionCallback).toHaveBeenCalledWith(5);

      mockPlayer.currentTime.mockReturnValue(10);
      mocks.triggerEvent('timeupdate');

      expect(positionCallback).toHaveBeenCalledWith(10);
    });

    test<VideoPositionSourceTestContext>('should update internal position on timeupdate', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      mockPlayer.currentTime.mockReturnValue(15);
      mocks.triggerEvent('timeupdate');

      expect(source.getPosition()).toBe(15);
    });

    test<VideoPositionSourceTestContext>('should support multiple position callbacks', async ({
      source,
      mockPlayer,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      source.onPosition(callback1);
      source.onPosition(callback2);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      mockPlayer.currentTime.mockReturnValue(20);
      mocks.triggerEvent('timeupdate');

      expect(callback1).toHaveBeenCalledWith(20);
      expect(callback2).toHaveBeenCalledWith(20);
    });

    test<VideoPositionSourceTestContext>('should not emit position updates when suspended', async ({
      source,
      positionCallback,
      mockPlayer,
    }) => {
      source.onPosition(positionCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      source.suspend();

      positionCallback.mockClear();

      // Timeupdate shouldn't trigger callback when suspended
      mockPlayer.currentTime.mockReturnValue(25);
      mocks.triggerEvent('timeupdate');

      expect(positionCallback).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T019: Seek and boundary events tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('seek and boundary events (T019)', () => {
    test<VideoPositionSourceTestContext>('should implement ISeekable interface', ({
      source,
    }) => {
      expect(typeof source.seek).toBe('function');
    });

    test<VideoPositionSourceTestContext>('should seek to specified position', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Mock currentTime to return the sought position after seek
      mockPlayer.currentTime.mockImplementation((time?: number) => {
        if (time !== undefined) {
          // Setting currentTime
          return undefined;
        }
        return 30; // Return the position after seek
      });

      // Start seek
      const seekPromise = source.seek(30);

      // Trigger seeked event
      mocks.triggerOneEvent('seeked');

      const result = await seekPromise;

      expect(result).toBe(30);
    });

    test<VideoPositionSourceTestContext>('should emit position callback after seek', async ({
      source,
      positionCallback,
      mockPlayer,
    }) => {
      source.onPosition(positionCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      positionCallback.mockClear();

      mockPlayer.currentTime.mockImplementation((time?: number) => {
        if (time !== undefined) return undefined;
        return 25;
      });

      const seekPromise = source.seek(25);
      mocks.triggerOneEvent('seeked');
      await seekPromise;

      expect(positionCallback).toHaveBeenCalledWith(25);
    });

    test<VideoPositionSourceTestContext>('should emit end boundary when video ends', async ({
      source,
      boundaryCallback,
    }) => {
      source.onBoundaryReached(boundaryCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Trigger ended event
      mocks.triggerEvent('ended');

      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test<VideoPositionSourceTestContext>('should deactivate after end when loop is false', async ({
      source,
    }) => {
      source.loop = false;

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Trigger ended event
      mocks.triggerEvent('ended');

      expect(source.state).toBe('inactive');
    });

    test<VideoPositionSourceTestContext>('should reset and emit start boundary when loop is true', async ({
      source,
      boundaryCallback,
      mockPlayer,
    }) => {
      source.loop = true;
      source.onBoundaryReached(boundaryCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();

      // Trigger ended event
      mocks.triggerEvent('ended');

      // Should have emitted end and start
      expect(boundaryCallback).toHaveBeenCalledWith('end');
      expect(boundaryCallback).toHaveBeenCalledWith('start');

      // Should still be active
      expect(source.state).toBe('active');

      // Should have reset currentTime
      expect(mockPlayer.currentTime).toHaveBeenCalledWith(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T020: Container provider methods tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('container provider methods (T020)', () => {
    test<VideoPositionSourceTestContext>('should implement IContainerProvider interface', ({
      source,
    }) => {
      expect(typeof source.getContainer).toBe('function');
      expect(typeof source.onContainerReady).toBe('function');
    });

    test<VideoPositionSourceTestContext>('should return container from getContainer()', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      const container = source.getContainer();

      // Container should be a jQuery-wrapped element
      expect(container).toBeDefined();
    });

    test<VideoPositionSourceTestContext>('should call onContainerReady callback on first frame', async ({
      source,
      containerReadyCallback,
    }) => {
      source.onContainerReady(containerReadyCallback);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      expect(containerReadyCallback).not.toHaveBeenCalled();

      // video.js 8 has no player 'firstplay' event; first 'playing' marks readiness
      mocks.triggerOneEvent('playing');

      expect(containerReadyCallback).toHaveBeenCalledTimes(1);
    });

    test<VideoPositionSourceTestContext>('should support multiple container ready callbacks', async ({
      source,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      source.onContainerReady(callback1);
      source.onContainerReady(callback2);

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      mocks.triggerOneEvent('playing');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Additional lifecycle tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('lifecycle', () => {
    test<VideoPositionSourceTestContext>('destroy() should remove event listeners', async ({
      source,
      mockPlayer,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      source.destroy();

      expect(mockPlayer.off).toHaveBeenCalled();
    });

    test<VideoPositionSourceTestContext>('destroy() should transition to inactive state', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      await source.activate();
      source.destroy();

      expect(source.state).toBe('inactive');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Failure paths: init errors, autoplay rejection, destroy while pending
  // ─────────────────────────────────────────────────────────────────────────

  describe('init failures', () => {
    test<VideoPositionSourceTestContext>('given a player that emits error and never canplay, when init() is called, then init() rejects', async ({
      source,
    }) => {
      const initPromise = source.init();
      const settled = expect(initPromise).rejects.toThrow(
        'VideoPositionSource'
      );
      await vi.advanceTimersByTimeAsync(10);

      mocks.triggerOneEvent('error');

      await settled;
    });

    test('given a selector that matches nothing, when init() is called, then init() rejects without calling videojs', async () => {
      const source = new VideoPositionSource({
        selector: '#does-not-exist',
        sources: [{src: 'video.mp4', type: 'video/mp4'}],
      });

      const settled = expect(source.init()).rejects.toThrow('#does-not-exist');
      await vi.advanceTimersByTimeAsync(10);

      await settled;
      expect(mocks.getVideojsCallCount()).toBe(0);
    });

    test<VideoPositionSourceTestContext>('given videojs() throws, when init() is called, then init() rejects with that error', async ({
      source,
    }) => {
      mocks.setVideojsError(
        new Error('The element or ID supplied is not valid')
      );

      const settled = expect(source.init()).rejects.toThrow(
        'The element or ID supplied is not valid'
      );
      await vi.advanceTimersByTimeAsync(10);

      await settled;
    });

    test<VideoPositionSourceTestContext>('given init() was called but not awaited, when destroy() is called and timers run, then videojs is not called and init settles', async ({
      source,
    }) => {
      const initPromise = source.init();
      const settled = expect(initPromise).rejects.toThrow('destroyed');

      source.destroy();
      await vi.advanceTimersByTimeAsync(10);

      await settled;
      expect(mocks.getVideojsCallCount()).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // video.js is an optional peer dependency, loaded on first init()
  // ─────────────────────────────────────────────────────────────────────────

  describe('lazy video.js loading', () => {
    const importFreshSource = async () => {
      vi.resetModules();
      const module = await import(
        '@timelineproviders/position-sources/video-position-source.ts'
      );
      return module.VideoPositionSource;
    };

    const restoreVideojsMock = () => {
      vi.doMock('video.js', videojsModule.factory);
      vi.resetModules();
    };

    const createSource = (Source: typeof VideoPositionSource) =>
      new Source({
        selector: '#video-container',
        sources: [{src: 'video.mp4', type: 'video/mp4'}],
      });

    test('given the module is imported, when no source has been initialised, then video.js is not loaded until init()', async () => {
      const factory = vi.fn(videojsModule.factory);
      vi.doMock('video.js', factory);
      try {
        const FreshSource = await importFreshSource();
        const source = createSource(FreshSource);
        expect(factory).not.toHaveBeenCalled();

        const initPromise = source.init();
        await vi.waitFor(() => {
          expect(mocks.getVideojsCallCount()).toBe(1);
        });
        await vi.advanceTimersByTimeAsync(10);
        mocks.triggerOneEvent('canplay');
        await initPromise;

        expect(factory).toHaveBeenCalledTimes(1);
        source.destroy();
      } finally {
        restoreVideojsMock();
      }
    });

    test('given video.js is not installed, when init() is called, then init() rejects with an error naming the video.js peer dependency', async () => {
      vi.doMock('video.js', () => {
        throw new Error("Cannot find package 'video.js'");
      });
      try {
        const FreshSource = await importFreshSource();
        const source = createSource(FreshSource);

        await expect(source.init()).rejects.toThrow(
          /VideoPositionSource requires the optional peer dependency 'video.js'/
        );
        expect(mocks.getVideojsCallCount()).toBe(0);
        source.destroy();
      } finally {
        restoreVideojsMock();
      }
    });
  });

  describe('autoplay rejection', () => {
    const initSource = async (source: VideoPositionSource) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;
    };

    test<VideoPositionSourceTestContext>('given player.play() rejects with NotAllowedError, when activate() is awaited, then it rejects, state is not active and onActivated is not called', async ({
      source,
      mockPlayer,
    }) => {
      const activated = vi.fn();
      source.onActivated(activated);
      await initSource(source);
      const notAllowed = new Error('play() failed');
      notAllowed.name = 'NotAllowedError';
      mockPlayer.play.mockRejectedValueOnce(notAllowed);

      await expect(source.activate()).rejects.toBe(notAllowed);

      expect(source.state).toBe('inactive');
      expect(activated).not.toHaveBeenCalled();
    });

    test<VideoPositionSourceTestContext>('given player.play() resolves, when activate() is awaited, then onActivated is called once', async ({
      source,
    }) => {
      const activated = vi.fn();
      source.onActivated(activated);
      await initSource(source);

      await source.activate();

      expect(source.state).toBe('active');
      expect(activated).toHaveBeenCalledTimes(1);
    });

    test<VideoPositionSourceTestContext>('given loop and a rejected replay, when the video ends, then the rejection is handled', async ({
      source,
      mockPlayer,
    }) => {
      source.loop = true;
      await initSource(source);
      await source.activate();
      const replay = Promise.reject(new Error('NotAllowedError'));
      const catchSpy = vi.spyOn(replay, 'catch');
      mockPlayer.play.mockReturnValueOnce(replay);

      mocks.triggerEvent('ended');
      await vi.advanceTimersByTimeAsync(0);

      expect(catchSpy).toHaveBeenCalled();
    });
  });

  describe('container ready', () => {
    test<VideoPositionSourceTestContext>('given container already ready, when onContainerReady is registered, then the callback is called immediately', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;
      mocks.triggerOneEvent('playing');

      const lateCallback = vi.fn();
      source.onContainerReady(lateCallback);

      expect(lateCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy while seeking', () => {
    test<VideoPositionSourceTestContext>('given a seek waiting for seeked, when destroy() is called, then the seek promise settles', async ({
      source,
    }) => {
      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      const seekPromise = source.seek(30);
      source.destroy();

      await expect(seekPromise).resolves.toBeTypeOf('number');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('configuration', () => {
    test('should accept video sources in configuration', () => {
      const source = new VideoPositionSource({
        selector: '#player',
        sources: [
          {src: 'video.mp4', type: 'video/mp4'},
          {src: 'video.webm', type: 'video/webm'},
        ],
      });

      expect(source).toBeDefined();
    });

    test('should use provided selector for container', async () => {
      // Create a container element in the DOM
      const container = document.createElement('div');
      container.id = 'test-player';
      document.body.appendChild(container);

      const source = new VideoPositionSource({
        selector: '#test-player',
        sources: [{src: 'video.mp4', type: 'video/mp4'}],
      });

      const initPromise = source.init();
      await vi.advanceTimersByTimeAsync(10);
      mocks.triggerOneEvent('canplay');
      await initPromise;

      const foundContainer = source.getContainer();
      expect(foundContainer?.length).toBeGreaterThan(0);

      // Cleanup
      document.body.removeChild(container);
    });
  });
});
