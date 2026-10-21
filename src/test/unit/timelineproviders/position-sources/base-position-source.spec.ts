import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {TBoundary, TSourceState} from '@timelineproviders/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

/**
 * Concrete implementation for testing the abstract BasePositionSource.
 * Only implements the abstract methods with minimal behavior.
 */
class TestablePositionSource extends BasePositionSource {
  public initCalled = false;
  public destroyCalled = false;
  public startTickingCalled = false;
  public stopTickingCalled = false;

  constructor(duration: number) {
    super(duration);
  }

  protected doInit(): Promise<void> {
    this.initCalled = true;
    return Promise.resolve();
  }

  protected doDestroy(): void {
    this.destroyCalled = true;
  }

  protected startTicking(): void {
    this.startTickingCalled = true;
  }

  protected stopTicking(): void {
    this.stopTickingCalled = true;
  }

  // Expose protected methods for testing
  public testSetPosition(position: number): void {
    this.setPosition(position);
  }

  public testEmitBoundary(boundary: TBoundary): void {
    this.emitBoundary(boundary);
  }

  public isDestroyedForTest(): boolean {
    return this.isDestroyed;
  }
}

type BasePositionSourceTestContext = {
  source: TestablePositionSource;
  positionCallback: (position: number) => void;
  boundaryCallback: (boundary: TBoundary) => void;
} & TestContext;

describe('BasePositionSource', () => {
  beforeEach<BasePositionSourceTestContext>(context => {
    context.source = new TestablePositionSource(60);
    context.positionCallback = vi.fn();
    context.boundaryCallback = vi.fn();
  });

  describe('initial state', () => {
    test<BasePositionSourceTestContext>('should start in inactive state', ({
      source,
    }) => {
      expect(source.state).toBe('inactive');
    });

    test<BasePositionSourceTestContext>('should have position 0 initially', ({
      source,
    }) => {
      expect(source.getPosition()).toBe(0);
    });

    test<BasePositionSourceTestContext>('should return configured duration', ({
      source,
    }) => {
      expect(source.getDuration()).toBe(60);
    });

    test<BasePositionSourceTestContext>('should have loop disabled by default', ({
      source,
    }) => {
      expect(source.loop).toBe(false);
    });
  });

  describe('state transitions', () => {
    describe('from inactive state', () => {
      test<BasePositionSourceTestContext>('activate() should transition to active state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        expect(source.state).toBe('active');
      });

      test<BasePositionSourceTestContext>('activate() should call startTicking()', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        expect(source.startTickingCalled).toBe(true);
      });

      test<BasePositionSourceTestContext>('suspend() from inactive should remain inactive', async ({
        source,
      }) => {
        await source.init();
        source.suspend();
        expect(source.state).toBe('inactive');
      });

      test<BasePositionSourceTestContext>('deactivate() from inactive should remain inactive', async ({
        source,
      }) => {
        await source.init();
        source.deactivate();
        expect(source.state).toBe('inactive');
      });
    });

    describe('from active state', () => {
      test<BasePositionSourceTestContext>('suspend() should transition to suspended state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.suspend();
        expect(source.state).toBe('suspended');
      });

      test<BasePositionSourceTestContext>('suspend() should call stopTicking()', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.stopTickingCalled = false; // Reset
        source.suspend();
        expect(source.stopTickingCalled).toBe(true);
      });

      test<BasePositionSourceTestContext>('suspend() should preserve position', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.testSetPosition(30);
        source.suspend();
        expect(source.getPosition()).toBe(30);
      });

      test<BasePositionSourceTestContext>('deactivate() should transition to inactive state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.deactivate();
        expect(source.state).toBe('inactive');
      });

      test<BasePositionSourceTestContext>('deactivate() should reset position to 0', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.testSetPosition(30);
        source.deactivate();
        expect(source.getPosition()).toBe(0);
      });

      test<BasePositionSourceTestContext>('activate() when already active should remain active', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.startTickingCalled = false; // Reset
        await source.activate();
        expect(source.state).toBe('active');
        // Should not start ticking again
        expect(source.startTickingCalled).toBe(false);
      });
    });

    describe('from suspended state', () => {
      test<BasePositionSourceTestContext>('activate() should transition back to active state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.suspend();
        await source.activate();
        expect(source.state).toBe('active');
      });

      test<BasePositionSourceTestContext>('activate() from suspended should preserve position', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.testSetPosition(30);
        source.suspend();
        await source.activate();
        expect(source.getPosition()).toBe(30);
      });

      test<BasePositionSourceTestContext>('activate() from suspended should call startTicking()', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.suspend();
        source.startTickingCalled = false; // Reset
        await source.activate();
        expect(source.startTickingCalled).toBe(true);
      });

      test<BasePositionSourceTestContext>('deactivate() should transition to inactive state', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.suspend();
        source.deactivate();
        expect(source.state).toBe('inactive');
      });

      test<BasePositionSourceTestContext>('deactivate() from suspended should reset position to 0', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.testSetPosition(30);
        source.suspend();
        source.deactivate();
        expect(source.getPosition()).toBe(0);
      });

      test<BasePositionSourceTestContext>('suspend() when already suspended should remain suspended', async ({
        source,
      }) => {
        await source.init();
        await source.activate();
        source.suspend();
        source.suspend();
        expect(source.state).toBe('suspended');
      });
    });
  });

  describe('lifecycle', () => {
    test<BasePositionSourceTestContext>('init() should call doInit()', async ({
      source,
    }) => {
      await source.init();
      expect(source.initCalled).toBe(true);
    });

    test<BasePositionSourceTestContext>('destroy() should call doDestroy()', async ({
      source,
    }) => {
      await source.init();
      source.destroy();
      expect(source.destroyCalled).toBe(true);
    });

    test<BasePositionSourceTestContext>('destroy() should deactivate if active', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.destroy();
      expect(source.state).toBe('inactive');
    });
  });

  describe('position updates', () => {
    test<BasePositionSourceTestContext>('onPosition() should register callback', async ({
      source,
      positionCallback,
    }) => {
      source.onPosition(positionCallback);
      await source.init();
      await source.activate();
      source.testSetPosition(10);
      expect(positionCallback).toHaveBeenCalledWith(10);
    });

    test<BasePositionSourceTestContext>('setPosition() should not emit callback when not active', async ({
      source,
      positionCallback,
    }) => {
      source.onPosition(positionCallback);
      await source.init();
      source.testSetPosition(10);
      expect(positionCallback).not.toHaveBeenCalled();
    });

    test<BasePositionSourceTestContext>('multiple onPosition() callbacks should all be called', async ({
      source,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      source.onPosition(callback1);
      source.onPosition(callback2);
      await source.init();
      await source.activate();
      source.testSetPosition(15);
      expect(callback1).toHaveBeenCalledWith(15);
      expect(callback2).toHaveBeenCalledWith(15);
    });
  });

  describe('boundary events', () => {
    test<BasePositionSourceTestContext>('onBoundaryReached() should register callback', async ({
      source,
      boundaryCallback,
    }) => {
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      source.testEmitBoundary('end');
      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test<BasePositionSourceTestContext>('should emit start boundary', async ({
      source,
      boundaryCallback,
    }) => {
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      source.testEmitBoundary('start');
      expect(boundaryCallback).toHaveBeenCalledWith('start');
    });

    test<BasePositionSourceTestContext>('multiple onBoundaryReached() callbacks should all be called', async ({
      source,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      source.onBoundaryReached(callback1);
      source.onBoundaryReached(callback2);
      await source.init();
      await source.activate();
      source.testEmitBoundary('end');
      expect(callback1).toHaveBeenCalledWith('end');
      expect(callback2).toHaveBeenCalledWith('end');
    });
  });

  describe('loop property', () => {
    test<BasePositionSourceTestContext>('loop should be settable', ({
      source,
    }) => {
      source.loop = true;
      expect(source.loop).toBe(true);
    });

    test<BasePositionSourceTestContext>('loop should be toggleable', ({
      source,
    }) => {
      source.loop = true;
      source.loop = false;
      expect(source.loop).toBe(false);
    });
  });

  describe('async startTicking', () => {
    class AsyncStartSource extends TestablePositionSource {
      public startResult: Promise<void> = Promise.resolve();

      protected override startTicking(): Promise<void> {
        return this.startResult;
      }
    }

    test('given startTicking rejects, when activate is awaited, then it rejects, state reverts and onActivated is not called', async () => {
      const source = new AsyncStartSource(60);
      const activated = vi.fn();
      source.onActivated(activated);
      await source.init();
      source.startResult = Promise.reject(new Error('NotAllowedError'));

      await expect(source.activate()).rejects.toThrow('NotAllowedError');

      expect(source.state).toBe('inactive');
      expect(activated).not.toHaveBeenCalled();
    });

    test('given a suspended source whose startTicking rejects, when activate is awaited, then state stays suspended', async () => {
      const source = new AsyncStartSource(60);
      await source.init();
      await source.activate();
      source.suspend();
      source.startResult = Promise.reject(new Error('NotAllowedError'));

      await expect(source.activate()).rejects.toThrow('NotAllowedError');

      expect(source.state).toBe('suspended');
    });

    test('given startTicking resolves, when activate is awaited, then onActivated fires after it resolves', async () => {
      const source = new AsyncStartSource(60);
      const activated = vi.fn();
      source.onActivated(activated);
      await source.init();
      let resolveStart: () => void = () => {};
      source.startResult = new Promise<void>(resolve => {
        resolveStart = resolve;
      });

      const activation = source.activate();
      expect(source.state).toBe('active');
      expect(activated).not.toHaveBeenCalled();

      resolveStart();
      await activation;

      expect(activated).toHaveBeenCalledTimes(1);
    });

    test('given suspend is called while startTicking is pending, when it rejects, then activate resolves and state stays suspended', async () => {
      const source = new AsyncStartSource(60);
      const activated = vi.fn();
      source.onActivated(activated);
      await source.init();
      let rejectStart: (error: Error) => void = () => {};
      source.startResult = new Promise<void>((_resolve, reject) => {
        rejectStart = reject;
      });

      const activation = source.activate();
      source.suspend();
      rejectStart(new Error('AbortError'));

      await expect(activation).resolves.toBeUndefined();
      expect(source.state).toBe('suspended');
      expect(activated).not.toHaveBeenCalled();
    });
  });
});

describe('BasePositionSource activation tokens', () => {
  class ControlledStartSource extends TestablePositionSource {
    public readonly starts: Array<{
      resolve: () => void;
      reject: (error: Error) => void;
    }> = [];

    protected override startTicking(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        this.starts.push({resolve, reject});
      });
    }
  }

  test('given activate then suspend then activate while the first startTicking is pending, when the first start rejects with AbortError and the second resolves, then state is active and onActivated is called once', async () => {
    const source = new ControlledStartSource(60);
    const activated = vi.fn();
    source.onActivated(activated);
    await source.init();

    const first = source.activate();
    source.suspend();
    const second = source.activate();
    source.starts[0].reject(new Error('AbortError'));
    source.starts[1].resolve();

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    expect(source.state).toBe('active');
    expect(activated).toHaveBeenCalledTimes(1);
  });

  test('given activate then suspend then activate, when the second start rejects, then the second activate rejects and state reverts to suspended', async () => {
    const source = new ControlledStartSource(60);
    await source.init();

    const first = source.activate();
    source.suspend();
    const second = source.activate();
    source.starts[0].resolve();
    source.starts[1].reject(new Error('NotAllowedError'));

    await expect(first).resolves.toBeUndefined();
    await expect(second).rejects.toThrow('NotAllowedError');
    expect(source.state).toBe('suspended');
  });

  test('given destroy while startTicking is pending, when it resolves, then onActivated is not called', async () => {
    const source = new ControlledStartSource(60);
    const activated = vi.fn();
    source.onActivated(activated);
    await source.init();

    const activation = source.activate();
    source.destroy();
    source.starts[0].resolve();

    await expect(activation).resolves.toBeUndefined();
    expect(activated).not.toHaveBeenCalled();
    expect(source.state).toBe('inactive');
  });
});

describe('BasePositionSource callback isolation', () => {
  test('given a position callback that throws, when the position changes, then later callbacks still run and the error is logged', async () => {
    const source = new TestablePositionSource(60);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const later = vi.fn();
    source.onPosition(() => {
      throw new Error('boom');
    });
    source.onPosition(later);
    await source.init();
    await source.activate();

    expect(() => source.testSetPosition(5)).not.toThrow();

    expect(later).toHaveBeenCalledWith(5);
    expect(source.getPosition()).toBe(5);
    expect(error).toHaveBeenCalled();
  });

  test('given a boundary callback that throws, when a boundary is emitted, then later callbacks still run', async () => {
    const source = new TestablePositionSource(60);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const later = vi.fn();
    source.onBoundaryReached(() => {
      throw new Error('boom');
    });
    source.onBoundaryReached(later);
    await source.init();
    await source.activate();

    expect(() => source.testEmitBoundary('end')).not.toThrow();
    expect(later).toHaveBeenCalledWith('end');
  });

  test('given an activated callback that throws, when activate is awaited, then it resolves and later callbacks still run', async () => {
    const source = new TestablePositionSource(60);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const later = vi.fn();
    source.onActivated(() => {
      throw new Error('boom');
    });
    source.onActivated(later);
    await source.init();

    await expect(source.activate()).resolves.toBeUndefined();
    expect(later).toHaveBeenCalledTimes(1);
    expect(source.state).toBe('active');
  });
});

describe('BasePositionSource destroy and unsubscribe', () => {
  test('given registered callbacks, when the returned unsubscribe functions are called, then the callbacks no longer fire', async () => {
    const source = new TestablePositionSource(60);
    const position = vi.fn();
    const boundary = vi.fn();
    const activated = vi.fn();
    const offPosition = source.onPosition(position);
    const offBoundary = source.onBoundaryReached(boundary);
    const offActivated = source.onActivated(activated);

    offPosition();
    offBoundary();
    offActivated();
    offPosition(); // idempotent
    await source.init();
    await source.activate();
    source.testSetPosition(3);
    source.testEmitBoundary('end');

    expect(position).not.toHaveBeenCalled();
    expect(boundary).not.toHaveBeenCalled();
    expect(activated).not.toHaveBeenCalled();
  });

  test('given a destroyed source, when activate is called, then it rejects and the source does not start ticking', async () => {
    const source = new TestablePositionSource(60);
    await source.init();
    source.destroy();
    source.startTickingCalled = false;

    await expect(source.activate()).rejects.toThrow(/destroyed/);
    expect(source.startTickingCalled).toBe(false);
    expect(source.state).toBe('inactive');
  });

  test('given a destroyed source, when its position changes, then callbacks registered before destroy are not called', async () => {
    const source = new TestablePositionSource(60);
    const position = vi.fn();
    const boundary = vi.fn();
    source.onPosition(position);
    source.onBoundaryReached(boundary);
    await source.init();
    source.destroy();

    source.testEmitBoundary('end');

    expect(boundary).not.toHaveBeenCalled();
    expect(source.isDestroyedForTest()).toBe(true);
  });
});
