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

// Mock the animationInterval utility
vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(),
}));

// Import after mock setup
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {animationInterval} from '@util/animation-interval.ts';

type RafPositionSourceTestContext = {
  source: RafPositionSource;
  positionCallback: Mock<(position: number) => void>;
  boundaryCallback: Mock<(boundary: TBoundary) => void>;
  activatedCallback: Mock<() => void>;
  mockAnimationInterval: ReturnType<typeof vi.fn>;
  capturedCallback: ((time: number) => void) | null;
  capturedSignal: AbortSignal | null;
} & TestContext;

describe('RafPositionSource', () => {
  beforeEach<RafPositionSourceTestContext>(context => {
    vi.useFakeTimers();

    context.capturedCallback = null;
    context.capturedSignal = null;

    // Capture the callback passed to animationInterval
    context.mockAnimationInterval = vi.mocked(animationInterval);
    context.mockAnimationInterval.mockImplementation(
      (ms: number, signal: AbortSignal, callback: (time: number) => void) => {
        context.capturedCallback = callback;
        context.capturedSignal = signal;
      }
    );

    context.source = new RafPositionSource({duration: 60}); // 60 seconds timeline
    context.positionCallback = vi.fn();
    context.boundaryCallback = vi.fn();
    context.activatedCallback = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T007: State transitions tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('state transitions (T007)', () => {
    describe('initial state', () => {
      test<RafPositionSourceTestContext>('should start in inactive state', ({
        source,
      }) => {
        expect(source.state).toBe('inactive');
      });

      test<RafPositionSourceTestContext>('should have position 0 initially', ({
        source,
      }) => {
        expect(source.getPosition()).toBe(0);
      });

      test<RafPositionSourceTestContext>('should return configured duration', ({
        source,
      }) => {
        expect(source.getDuration()).toBe(60);
      });
    });

    describe('activate()', () => {
      test<RafPositionSourceTestContext>('should transition to active state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        expect(source.state).toBe('active');
      });

      test<RafPositionSourceTestContext>('should start animationInterval', async ({
        source,
        mockAnimationInterval,
      }) => {
        await source.init();
        await source.activate();
        expect(mockAnimationInterval).toHaveBeenCalledTimes(1);
        expect(mockAnimationInterval).toHaveBeenCalledWith(
          1000, // tick interval
          expect.any(AbortSignal),
          expect.any(Function)
        );
      });

      test<RafPositionSourceTestContext>('should emit position 0 immediately on activate', async ({
        source,
        positionCallback,
      }) => {
        source.onPosition(positionCallback);
        await source.init();
        await source.activate();
        expect(positionCallback).toHaveBeenCalledWith(0);
      });
    });

    describe('suspend()', () => {
      test<RafPositionSourceTestContext>('should transition to suspended state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.suspend();
        expect(source.state).toBe('suspended');
      });

      test<RafPositionSourceTestContext>('should preserve position when suspended', async ({
        source,
        capturedCallback,
      }) => {
        await source.init();
        await source.activate();

        // Simulate ticks to advance position
        // Values are milliseconds since start: 1000ms = 1s, 2000ms = 2s, 3000ms = 3s
        capturedCallback?.(1000);
        capturedCallback?.(2000);
        capturedCallback?.(3000);

        const positionBeforeSuspend = source.getPosition();
        source.suspend();

        expect(source.getPosition()).toBe(positionBeforeSuspend);
      });

      test<RafPositionSourceTestContext>('should abort animationInterval signal on suspend', async context => {
        const {source} = context;
        await source.init();
        await source.activate();

        // Access capturedSignal AFTER activate() sets it
        expect(context.capturedSignal?.aborted).toBe(false);
        source.suspend();
        expect(context.capturedSignal?.aborted).toBe(true);
      });
    });

    describe('deactivate()', () => {
      test<RafPositionSourceTestContext>('should transition to inactive state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.deactivate();
        expect(source.state).toBe('inactive');
      });

      test<RafPositionSourceTestContext>('should reset position to 0', async ({
        source,
        capturedCallback,
      }) => {
        await source.init();
        await source.activate();

        // Simulate ticks to advance position
        capturedCallback?.(1000);
        capturedCallback?.(2000);

        source.deactivate();
        expect(source.getPosition()).toBe(0);
      });

      test<RafPositionSourceTestContext>('should abort animationInterval signal on deactivate', async context => {
        const {source} = context;
        await source.init();
        await source.activate();

        // Access capturedSignal AFTER activate() sets it
        expect(context.capturedSignal?.aborted).toBe(false);
        source.deactivate();
        expect(context.capturedSignal?.aborted).toBe(true);
      });
    });

    describe('resume from suspended', () => {
      test<RafPositionSourceTestContext>('should resume from suspended position', async ({
        source,
        capturedCallback,
        mockAnimationInterval,
      }) => {
        await source.init();
        await source.activate();

        // Simulate ticks
        capturedCallback?.(1000);
        capturedCallback?.(2000);
        const positionBeforeSuspend = source.getPosition();

        source.suspend();
        mockAnimationInterval.mockClear();

        await source.activate();

        expect(source.getPosition()).toBe(positionBeforeSuspend);
        expect(source.state).toBe('active');
        expect(mockAnimationInterval).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T008: Position updates and onPosition callback tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('position updates and onPosition callback (T008)', () => {
    test<RafPositionSourceTestContext>('should emit position updates on each tick', async context => {
      const {source, positionCallback} = context;
      source.onPosition(positionCallback);
      await source.init();
      await source.activate();

      // Initial position 0 emitted on activate
      expect(positionCallback).toHaveBeenCalledWith(0);

      // Simulate ticks (access capturedCallback AFTER activate() sets it)
      context.capturedCallback?.(1000);
      expect(positionCallback).toHaveBeenCalledWith(1);

      context.capturedCallback?.(2000);
      expect(positionCallback).toHaveBeenCalledWith(2);

      context.capturedCallback?.(3000);
      expect(positionCallback).toHaveBeenCalledWith(3);
    });

    test<RafPositionSourceTestContext>('should increment position by 1 per second', async context => {
      const {source} = context;
      await source.init();
      await source.activate();

      expect(source.getPosition()).toBe(0);

      // Access capturedCallback AFTER activate() sets it
      context.capturedCallback?.(1000);
      expect(source.getPosition()).toBe(1);

      context.capturedCallback?.(2000);
      expect(source.getPosition()).toBe(2);

      context.capturedCallback?.(3000);
      expect(source.getPosition()).toBe(3);
    });

    test<RafPositionSourceTestContext>('should support multiple position callbacks', async context => {
      const {source} = context;
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      source.onPosition(callback1);
      source.onPosition(callback2);

      await source.init();
      await source.activate();

      // Access capturedCallback AFTER activate() sets it
      context.capturedCallback?.(1000);

      expect(callback1).toHaveBeenCalledWith(1);
      expect(callback2).toHaveBeenCalledWith(1);
    });

    test<RafPositionSourceTestContext>('should not emit position updates when suspended', async ({
      source,
      positionCallback,
      capturedCallback,
    }) => {
      source.onPosition(positionCallback);
      await source.init();
      await source.activate();

      positionCallback.mockClear?.();
      source.suspend();

      // If the callback were still running (it won't be due to abort), it shouldn't emit
      capturedCallback?.(4000);

      expect(positionCallback).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T009: Boundary events and looping tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('boundary events and looping (T009)', () => {
    test<RafPositionSourceTestContext>('should emit end boundary when reaching duration', async ({
      source,
      boundaryCallback,
      capturedCallback,
    }) => {
      const shortSource = new RafPositionSource({duration: 3});
      shortSource.onBoundaryReached(boundaryCallback);

      await shortSource.init();
      await shortSource.activate();

      // Get the captured callback for this source
      const shortCallback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      // Tick to duration
      shortCallback?.(1000); // position 1
      shortCallback?.(2000); // position 2
      shortCallback?.(3000); // position 3 (= duration)

      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test<RafPositionSourceTestContext>('should deactivate after end boundary when loop is false', async ({
      boundaryCallback,
    }) => {
      const shortSource = new RafPositionSource({duration: 3});
      shortSource.loop = false;
      shortSource.onBoundaryReached(boundaryCallback);

      await shortSource.init();
      await shortSource.activate();

      const shortCallback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      // Tick to duration
      shortCallback?.(1000);
      shortCallback?.(2000);
      shortCallback?.(3000);

      expect(shortSource.state).toBe('inactive');
    });

    test<RafPositionSourceTestContext>('should reset position and continue when loop is true', async ({
      boundaryCallback,
    }) => {
      const shortSource = new RafPositionSource({duration: 3});
      shortSource.loop = true;
      shortSource.onBoundaryReached(boundaryCallback);

      await shortSource.init();
      await shortSource.activate();

      const shortCallback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      // Tick to duration
      shortCallback?.(1000); // position 1
      shortCallback?.(2000); // position 2
      shortCallback?.(3000); // position 3, emit end, reset to 0

      expect(boundaryCallback).toHaveBeenCalledWith('end');
      expect(shortSource.getPosition()).toBe(0);
      expect(shortSource.state).toBe('active');
    });

    test<RafPositionSourceTestContext>('should continue ticking after loop reset', async ({
      positionCallback,
    }) => {
      const shortSource = new RafPositionSource({duration: 3});
      shortSource.loop = true;
      shortSource.onPosition(positionCallback);

      await shortSource.init();
      await shortSource.activate();

      const shortCallback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      positionCallback.mockClear?.();

      // Tick to duration and beyond
      shortCallback?.(1000); // position 1
      shortCallback?.(2000); // position 2
      shortCallback?.(3000); // position 3 -> loop -> position 0

      expect(positionCallback).toHaveBeenLastCalledWith(0);

      shortCallback?.(4000); // position 1 again
      expect(shortSource.getPosition()).toBe(1);
    });

    test<RafPositionSourceTestContext>('should emit start boundary on loop reset', async ({
      boundaryCallback,
    }) => {
      const shortSource = new RafPositionSource({duration: 3});
      shortSource.loop = true;
      shortSource.onBoundaryReached(boundaryCallback);

      await shortSource.init();
      await shortSource.activate();

      const shortCallback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      shortCallback?.(1000);
      shortCallback?.(2000);
      shortCallback?.(3000);

      // Should have emitted both 'end' and 'start' (in that order)
      expect(boundaryCallback).toHaveBeenCalledWith('end');
      // Check if 'start' was also called after 'end'
      const calls = boundaryCallback.mock?.calls || [];
      const endIndex = calls.findIndex((c: [TBoundary]) => c[0] === 'end');
      const startIndex = calls.findIndex((c: [TBoundary]) => c[0] === 'start');

      expect(startIndex).toBeGreaterThan(endIndex);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T010: Seek functionality tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('seek functionality (T010)', () => {
    test<RafPositionSourceTestContext>('should implement ISeekable interface', ({
      source,
    }) => {
      expect(typeof source.seek).toBe('function');
    });

    test<RafPositionSourceTestContext>('should seek to specified position', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      const result = await source.seek(30);

      expect(result).toBe(30);
      expect(source.getPosition()).toBe(30);
    });

    test<RafPositionSourceTestContext>('should clamp seek to 0 when negative', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      const result = await source.seek(-10);

      expect(result).toBe(0);
      expect(source.getPosition()).toBe(0);
    });

    test<RafPositionSourceTestContext>('should clamp seek to duration when exceeding', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      const result = await source.seek(100);

      expect(result).toBe(60); // duration is 60
      expect(source.getPosition()).toBe(60);
    });

    test<RafPositionSourceTestContext>('should emit position callback after seek', async ({
      source,
      positionCallback,
    }) => {
      source.onPosition(positionCallback);
      await source.init();
      await source.activate();

      positionCallback.mockClear?.();

      await source.seek(25);

      expect(positionCallback).toHaveBeenCalledWith(25);
    });

    test<RafPositionSourceTestContext>('should work when inactive', async ({
      source,
    }) => {
      await source.init();

      const result = await source.seek(15);

      expect(result).toBe(15);
      expect(source.getPosition()).toBe(15);
    });

    test<RafPositionSourceTestContext>('should work when suspended', async ({
      source,
      capturedCallback,
    }) => {
      await source.init();
      await source.activate();

      capturedCallback?.(1000);
      source.suspend();

      const result = await source.seek(40);

      expect(result).toBe(40);
      expect(source.getPosition()).toBe(40);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Additional tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('configuration', () => {
    test('should accept tick interval in configuration', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 500});
      await source.init();
      await source.activate();

      expect(animationInterval).toHaveBeenCalledWith(
        500,
        expect.any(AbortSignal),
        expect.any(Function)
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Fractional position support tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('fractional position support', () => {
    test('should emit fractional positions when tickInterval is 100ms (0.1s precision)', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 100});
      const positionCallback = vi.fn();
      source.onPosition(positionCallback);

      await source.init();
      await source.activate();

      const callback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      // Simulate ticks at 100ms intervals
      callback?.(100); // 0.1s
      expect(positionCallback).toHaveBeenCalledWith(0.1);

      callback?.(200); // 0.2s
      expect(positionCallback).toHaveBeenCalledWith(0.2);

      callback?.(350); // 0.3s (floored to tick boundary)
      expect(positionCallback).toHaveBeenCalledWith(0.3);
    });

    test('should emit position 1.5 after 1500ms with 100ms tickInterval', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 100});
      const positionCallback = vi.fn();
      source.onPosition(positionCallback);

      await source.init();
      await source.activate();

      const callback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      callback?.(1500); // 1.5s
      expect(positionCallback).toHaveBeenCalledWith(1.5);
    });

    test('should emit position 5.7 after 5700ms with 100ms tickInterval', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 100});
      const positionCallback = vi.fn();
      source.onPosition(positionCallback);

      await source.init();
      await source.activate();

      const callback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      callback?.(5700);
      expect(positionCallback).toHaveBeenCalledWith(5.7);
    });

    test('should support seek to fractional positions', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 100});

      await source.init();
      await source.activate();

      const result = await source.seek(25.3);

      expect(result).toBe(25.3);
      expect(source.getPosition()).toBe(25.3);
    });

    test('should emit fractional position callback after seek', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 100});
      const positionCallback = vi.fn();
      source.onPosition(positionCallback);

      await source.init();
      await source.activate();
      positionCallback.mockClear();

      await source.seek(12.7);

      expect(positionCallback).toHaveBeenCalledWith(12.7);
    });

    test('should handle fractional duration boundary', async () => {
      const source = new RafPositionSource({duration: 3.5, tickInterval: 100});
      const boundaryCallback = vi.fn();
      source.onBoundaryReached(boundaryCallback);

      await source.init();
      await source.activate();

      const callback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      // Tick to duration
      callback?.(3400); // 3.4s
      expect(boundaryCallback).not.toHaveBeenCalled();

      callback?.(3500); // 3.5s = duration
      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test('should clamp fractional seek to duration', async () => {
      const source = new RafPositionSource({duration: 10.5, tickInterval: 100});

      await source.init();
      await source.activate();

      const result = await source.seek(15.7);

      expect(result).toBe(10.5);
      expect(source.getPosition()).toBe(10.5);
    });

    test('should loop correctly with fractional positions', async () => {
      const source = new RafPositionSource({duration: 2.5, tickInterval: 100});
      source.loop = true;
      const boundaryCallback = vi.fn();
      const positionCallback = vi.fn();
      source.onBoundaryReached(boundaryCallback);
      source.onPosition(positionCallback);

      await source.init();
      await source.activate();

      const callback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      // Tick to duration
      callback?.(2500); // 2.5s = duration

      expect(boundaryCallback).toHaveBeenCalledWith('end');
      expect(boundaryCallback).toHaveBeenCalledWith('start');
      expect(source.getPosition()).toBe(0);
      expect(source.state).toBe('active');
    });

    test('should preserve fractional position across suspend/resume', async () => {
      const source = new RafPositionSource({duration: 60, tickInterval: 100});

      await source.init();
      await source.activate();

      const callback = vi.mocked(animationInterval).mock.calls.at(-1)?.[2];

      callback?.(1300); // 1.3s
      expect(source.getPosition()).toBe(1.3);

      source.suspend();
      expect(source.getPosition()).toBe(1.3);

      await source.activate();
      expect(source.getPosition()).toBe(1.3);
    });
  });

  describe('lifecycle', () => {
    test<RafPositionSourceTestContext>('destroy() should abort animation interval', async context => {
      const {source} = context;
      await source.init();
      await source.activate();

      // Access capturedSignal AFTER activate() sets it
      expect(context.capturedSignal?.aborted).toBe(false);
      source.destroy();
      expect(context.capturedSignal?.aborted).toBe(true);
    });

    test<RafPositionSourceTestContext>('destroy() should transition to inactive state', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      source.destroy();
      expect(source.state).toBe('inactive');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // onActivated callback tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('onActivated callback', () => {
    test<RafPositionSourceTestContext>('should emit activated callback when transitioning to active state', async ({
      source,
      activatedCallback,
    }) => {
      source.onActivated(activatedCallback);
      await source.init();
      await source.activate();

      expect(activatedCallback).toHaveBeenCalledTimes(1);
    });

    test<RafPositionSourceTestContext>('should not emit activated callback when already active', async ({
      source,
      activatedCallback,
    }) => {
      source.onActivated(activatedCallback);
      await source.init();
      await source.activate();
      activatedCallback.mockClear();

      // Try to activate again
      await source.activate();

      expect(activatedCallback).not.toHaveBeenCalled();
    });

    test<RafPositionSourceTestContext>('should emit activated callback on each resume from suspended', async ({
      source,
      activatedCallback,
    }) => {
      source.onActivated(activatedCallback);
      await source.init();

      await source.activate();
      expect(activatedCallback).toHaveBeenCalledTimes(1);

      source.suspend();
      await source.activate();
      expect(activatedCallback).toHaveBeenCalledTimes(2);

      source.suspend();
      await source.activate();
      expect(activatedCallback).toHaveBeenCalledTimes(3);
    });

    test<RafPositionSourceTestContext>('should emit activated callback on resume from inactive', async ({
      source,
      activatedCallback,
    }) => {
      source.onActivated(activatedCallback);
      await source.init();

      await source.activate();
      expect(activatedCallback).toHaveBeenCalledTimes(1);

      source.deactivate();
      await source.activate();
      expect(activatedCallback).toHaveBeenCalledTimes(2);
    });

    test<RafPositionSourceTestContext>('should support multiple activated callbacks', async ({
      source,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      source.onActivated(callback1);
      source.onActivated(callback2);

      await source.init();
      await source.activate();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    test<RafPositionSourceTestContext>('should emit activated after startTicking is called', async ({
      source,
      activatedCallback,
      mockAnimationInterval,
    }) => {
      let activatedEmitted = false;
      let tickingStarted = false;

      mockAnimationInterval.mockImplementation(() => {
        // Record that ticking was started before checking activated
        tickingStarted = true;
      });

      source.onActivated(() => {
        activatedEmitted = true;
        // At this point, ticking should already have started
        expect(tickingStarted).toBe(true);
      });

      await source.init();
      await source.activate();

      expect(activatedEmitted).toBe(true);
    });
  });
});
