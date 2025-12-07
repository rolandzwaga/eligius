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
});
