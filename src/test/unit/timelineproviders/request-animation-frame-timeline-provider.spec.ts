import {RequestAnimationFrameTimelineProvider} from '@timelineproviders/request-animation-frame-timeline-provider.ts';
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

type RequestAnimationFrameTimelineProviderSuiteContext = {
  provider: RequestAnimationFrameTimelineProvider;
  configuration: any;
} & TestContext;

describe('RequestAnimationFrameTimelineProvider', () => {
  beforeEach<RequestAnimationFrameTimelineProviderSuiteContext>(context => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 16)
    );
    vi.stubGlobal('cancelAnimationFrame', () => {});

    $('<div id="selector"/>').appendTo(document.body);
    $('<div id="selector2"/>').appendTo(document.body);
    context.configuration = {
      timelines: [
        {
          type: 'animation',
          duration: 5,
          selector: '#selector',
          uri: 'timeline-1',
        },
        {
          type: 'animation',
          duration: 10,
          selector: '#selector2',
          uri: 'timeline-2',
        },
        {
          type: 'video',
          duration: 20,
          selector: '#video',
          uri: 'video-timeline',
        },
      ],
    };
    context.provider = new RequestAnimationFrameTimelineProvider(
      context.configuration
    );
  });

  afterEach<RequestAnimationFrameTimelineProviderSuiteContext>(context => {
    context.provider.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    $('#selector').remove();
    $('#selector2').remove();
  });

  // Basic playback control tests
  describe('playback controls', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should start and set correct play state', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();

      expect(provider.playState).toBe('running');
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should pause and set correct play state', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();
      expect(provider.playState).toBe('running');

      provider.pause();
      expect(provider.playState).toBe('stopped');
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should stop, set correct play state and reset position to zero', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();
      expect(provider.playState).toBe('running');

      provider.stop();
      expect(provider.playState).toBe('stopped');
      expect(provider.getPosition()).toBe(0);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should dispatch onTime callback as timeline progresses', async context => {
      const {provider} = context;
      await provider.init();

      const recordedPositions: number[] = [];
      provider.onTime((position: number) => recordedPositions.push(position));

      provider.start();

      // animationInterval uses setTimeout + requestAnimationFrame
      // Each tick needs: setTimeout delay (~1000ms) + RAF delay (~16ms)
      // Advance time for 4 ticks
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(1016); // 1000ms interval + 16ms RAF
      }

      expect(recordedPositions.length).toBe(5); // Initial 0 + 4 ticks
      expect(recordedPositions).toEqual([0, 1, 2, 3, 4]);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should pause without resetting position', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();
      // Advance 2 ticks (each tick = 1000ms + 16ms RAF)
      for (let i = 0; i < 2; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }

      provider.pause();

      expect(provider.playState).toBe('stopped');
      expect(provider.getPosition()).toBe(2);
    });
  });

  // Playlist management tests
  describe('playlistItem', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should switch to valid playlist item by URI', async context => {
      const {provider} = context;
      await provider.init();

      provider.playlistItem('timeline-2');

      expect(provider.getDuration()).toBe(10);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return early when URI is null', async context => {
      const {provider} = context;
      await provider.init();

      const initialDuration = provider.getDuration();
      provider.playlistItem(null as unknown as string);

      expect(provider.getDuration()).toBe(initialDuration);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return early when URI is empty string', async context => {
      const {provider} = context;
      await provider.init();

      const initialDuration = provider.getDuration();
      provider.playlistItem('');

      expect(provider.getDuration()).toBe(initialDuration);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return early when playlist is empty', context => {
      const emptyConfig = {timelines: []};
      const emptyProvider = new RequestAnimationFrameTimelineProvider(
        emptyConfig as any
      );

      // Should not throw
      emptyProvider.playlistItem('any-uri');
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should throw error for unknown URI', async context => {
      const {provider} = context;
      await provider.init();

      expect(() => provider.playlistItem('unknown-uri')).toThrow(
        'Unknown playlist uri: unknown-uri'
      );
    });
  });

  // Callback tests
  describe('callbacks', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should call onFirstFrame callback on first start only', async context => {
      const {provider} = context;
      await provider.init();

      const firstFrameCallback = vi.fn();
      provider.onFirstFrame(firstFrameCallback);

      provider.start();
      expect(firstFrameCallback).toHaveBeenCalledTimes(1);

      provider.stop();
      provider.start();
      expect(firstFrameCallback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should call onComplete callback when timeline ends (non-loop)', async context => {
      const {provider} = context;
      await provider.init();

      const completeCallback = vi.fn();
      provider.onComplete(completeCallback);

      provider.start();

      // Advance past the duration (5 seconds) + 1 tick to trigger complete
      // Duration is 5, so we need 6 ticks (position goes 0,1,2,3,4,5,6 and 6 > 5 triggers complete)
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }

      expect(completeCallback).toHaveBeenCalledTimes(1);
      expect(provider.playState).toBe('stopped');
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should call onRestart callback when loop is enabled and timeline completes', async context => {
      const {provider} = context;
      await provider.init();

      const restartCallback = vi.fn();
      const timeCallback = vi.fn();
      provider.onRestart(restartCallback);
      provider.onTime(timeCallback);
      provider.loop = true;

      provider.start();

      // Advance past the duration to trigger restart (6 ticks to go past duration of 5)
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }

      expect(restartCallback).toHaveBeenCalledTimes(1);
      expect(provider.playState).toBe('running'); // Still running due to loop
      expect(provider.getPosition()).toBe(0); // Reset to start
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should loop multiple times and call onRestart each time', async context => {
      const {provider} = context;
      await provider.init();

      const restartCallback = vi.fn();
      provider.onRestart(restartCallback);
      provider.loop = true;

      provider.start();

      // Advance past 2 full cycles (duration is 5, need 6 ticks per cycle for restart)
      // 2 restarts = 12 ticks
      for (let i = 0; i < 12; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }

      expect(restartCallback).toHaveBeenCalledTimes(2);
    });
  });

  // Seek tests
  describe('seek', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should update position when seeking to valid position', async context => {
      const {provider} = context;
      await provider.init();

      const result = await provider.seek(3);

      expect(result).toBe(3);
      expect(provider.getPosition()).toBe(3);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return current position when seeking below 0', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();
      // Advance 2 ticks
      for (let i = 0; i < 2; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }
      provider.pause();

      const currentPos = provider.getPosition();
      const result = await provider.seek(-5);

      expect(result).toBe(currentPos);
      expect(provider.getPosition()).toBe(currentPos); // Unchanged
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return current position when seeking above duration', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();
      // Advance 2 ticks
      for (let i = 0; i < 2; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }
      provider.pause();

      const currentPos = provider.getPosition();
      const result = await provider.seek(100);

      expect(result).toBe(currentPos);
      expect(provider.getPosition()).toBe(currentPos); // Unchanged
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should allow seeking to position 0', async context => {
      const {provider} = context;
      await provider.init();

      await provider.seek(3);
      const result = await provider.seek(0);

      expect(result).toBe(0);
      expect(provider.getPosition()).toBe(0);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should allow seeking to exact duration', async context => {
      const {provider} = context;
      await provider.init();

      const result = await provider.seek(5); // Duration is 5

      expect(result).toBe(5);
      expect(provider.getPosition()).toBe(5);
    });
  });

  // Initialization tests
  describe('init', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should throw error when selector not found', context => {
      const badConfig = {
        timelines: [
          {
            type: 'animation',
            duration: 5,
            selector: '#nonexistent',
            uri: 'bad-timeline',
          },
        ],
      };
      const badProvider = new RequestAnimationFrameTimelineProvider(
        badConfig as any
      );

      // init() throws synchronously before returning the promise
      expect(() => badProvider.init()).toThrow(
        "timeline selector '#nonexistent' not found"
      );
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should set container element on init', async context => {
      const {provider} = context;

      expect(provider.getContainer()).toBeUndefined();

      await provider.init();

      expect(provider.getContainer()).toBeDefined();
      expect(provider.getContainer()?.length).toBe(1);
    });
  });

  // Getter tests
  describe('getters', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return correct duration from getDuration', async context => {
      const {provider} = context;
      await provider.init();

      expect(provider.getDuration()).toBe(5);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return container element from getContainer', async context => {
      const {provider} = context;
      await provider.init();

      const container = provider.getContainer();

      expect(container).toBeDefined();
      expect(container?.is('#selector')).toBe(true);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should return current position from getPosition', async context => {
      const {provider} = context;
      await provider.init();

      expect(provider.getPosition()).toBe(0);

      provider.start();
      // Advance 3 ticks
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }

      expect(provider.getPosition()).toBe(3);
    });
  });

  // Destroy tests
  describe('destroy', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should stop timeline and clear container on destroy', async context => {
      const {provider} = context;
      await provider.init();

      provider.start();
      expect(provider.playState).toBe('running');

      provider.destroy();

      expect(provider.playState).toBe('stopped');
      expect(provider.getContainer()).toBeUndefined();
    });
  });

  // Edge cases
  describe('edge cases', () => {
    test<RequestAnimationFrameTimelineProviderSuiteContext>('should call onTime callback at position 0 when start called while already running at position 0', async context => {
      const {provider} = context;
      await provider.init();

      const timeCallback = vi.fn();
      provider.onTime(timeCallback);

      provider.start();
      expect(timeCallback).toHaveBeenCalledWith(0);

      timeCallback.mockClear();

      // Call start again while running at position 0
      provider.start();
      expect(timeCallback).toHaveBeenCalledWith(0);
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should not call onTime callback when start called while running at non-zero position', async context => {
      const {provider} = context;
      await provider.init();

      const timeCallback = vi.fn();
      provider.onTime(timeCallback);

      provider.start();
      // Advance 2 ticks
      for (let i = 0; i < 2; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }

      timeCallback.mockClear();

      // Call start again while running at position 2
      provider.start();
      expect(timeCallback).not.toHaveBeenCalled();
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should only include animation type timelines in playlist', context => {
      const {provider} = context;

      // The configuration has 3 timelines, but only 2 are type 'animation'
      // This is verified by checking that we can access timeline-1 and timeline-2
      // but the video timeline is not included
      provider.playlistItem('timeline-1');
      expect(provider.getDuration()).toBe(5);

      provider.playlistItem('timeline-2');
      expect(provider.getDuration()).toBe(10);

      // Video timeline should not be in playlist
      expect(() => provider.playlistItem('video-timeline')).toThrow(
        'Unknown playlist uri: video-timeline'
      );
    });

    test<RequestAnimationFrameTimelineProviderSuiteContext>('should handle multiple start/stop cycles correctly', async context => {
      const {provider} = context;
      await provider.init();

      const timeCallback = vi.fn();
      provider.onTime(timeCallback);

      // First cycle
      provider.start();
      // Advance 2 ticks
      for (let i = 0; i < 2; i++) {
        await vi.advanceTimersByTimeAsync(1016);
      }
      provider.stop();

      expect(provider.getPosition()).toBe(0);

      // Second cycle
      provider.start();
      // Advance 1 tick
      await vi.advanceTimersByTimeAsync(1016);

      expect(provider.getPosition()).toBe(1);
    });
  });
});
