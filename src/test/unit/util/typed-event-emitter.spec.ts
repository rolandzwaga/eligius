import {TypedEventEmitter} from '@util/typed-event-emitter.ts';
import {beforeEach, describe, expect, test, vi} from 'vitest';

// Test event map for type-safe testing
interface TestEvents {
  simple: [];
  withArg: [value: string];
  withMultipleArgs: [a: number, b: string, c: boolean];
}

describe('TypedEventEmitter', () => {
  let emitter: TypedEventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new TypedEventEmitter<TestEvents>();
  });

  describe('on()', () => {
    test('should register a handler and call it when event is emitted', () => {
      const handler = vi.fn();
      emitter.on('simple', handler);

      emitter.emit('simple');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to handler', () => {
      const handler = vi.fn();
      emitter.on('withArg', handler);

      emitter.emit('withArg', 'test-value');

      expect(handler).toHaveBeenCalledWith('test-value');
    });

    test('should pass multiple arguments to handler', () => {
      const handler = vi.fn();
      emitter.on('withMultipleArgs', handler);

      emitter.emit('withMultipleArgs', 42, 'hello', true);

      expect(handler).toHaveBeenCalledWith(42, 'hello', true);
    });

    test('should return an unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('simple', handler);

      unsubscribe();
      emitter.emit('simple');

      expect(handler).not.toHaveBeenCalled();
    });

    test('should allow multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('simple', handler1);
      emitter.on('simple', handler2);
      emitter.emit('simple');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test('should preserve handler registration order', () => {
      const calls: number[] = [];
      const handler1 = () => calls.push(1);
      const handler2 = () => calls.push(2);
      const handler3 = () => calls.push(3);

      emitter.on('simple', handler1);
      emitter.on('simple', handler2);
      emitter.on('simple', handler3);
      emitter.emit('simple');

      expect(calls).toEqual([1, 2, 3]);
    });
  });

  describe('once()', () => {
    test('should call handler only once', () => {
      const handler = vi.fn();
      emitter.once('simple', handler);

      emitter.emit('simple');
      emitter.emit('simple');
      emitter.emit('simple');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to once handler', () => {
      const handler = vi.fn();
      emitter.once('withArg', handler);

      emitter.emit('withArg', 'once-value');

      expect(handler).toHaveBeenCalledWith('once-value');
    });

    test('should return an unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.once('simple', handler);

      unsubscribe();
      emitter.emit('simple');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('off()', () => {
    test('should remove a specific handler', () => {
      const handler = vi.fn();
      emitter.on('simple', handler);

      emitter.off('simple', handler);
      emitter.emit('simple');

      expect(handler).not.toHaveBeenCalled();
    });

    test('should only remove the specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('simple', handler1);
      emitter.on('simple', handler2);
      emitter.off('simple', handler1);
      emitter.emit('simple');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test('should do nothing if handler is not registered', () => {
      const handler = vi.fn();

      // Should not throw
      expect(() => emitter.off('simple', handler)).not.toThrow();
    });

    test('given a handler registered with once(), when off() is called with that same handler and the event is emitted, then the handler is not called', () => {
      const handler = vi.fn();
      emitter.once('simple', handler);

      emitter.off('simple', handler);
      emitter.emit('simple');

      expect(handler).not.toHaveBeenCalled();
    });

    test('given the same handler registered with on() and once(), when off() is called with it once, then only the earlier registration is removed', () => {
      const handler = vi.fn();
      emitter.on('withArg', handler);
      emitter.once('withArg', handler);

      emitter.off('withArg', handler);
      emitter.emit('withArg', 'first');
      emitter.emit('withArg', 'second');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('first');
    });
  });

  describe('emit()', () => {
    test('should do nothing if no handlers registered', () => {
      // Should not throw
      expect(() => emitter.emit('simple')).not.toThrow();
    });

    test('should isolate errors in handlers (not break other handlers)', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const handler1 = vi.fn();
      const handler2 = vi.fn(() => {
        throw new Error('Handler error');
      });
      const handler3 = vi.fn();

      emitter.on('simple', handler1);
      emitter.on('simple', handler2);
      emitter.on('simple', handler3);

      // Should not throw
      expect(() => emitter.emit('simple')).not.toThrow();

      // All handlers should be called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // Error should be logged
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    test('given an async handler that rejects, when the event is emitted, then the rejection is logged naming the event and later handlers still run', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const failure = new Error('async failure');
      const asyncHandler = vi.fn(async () => {
        throw failure;
      });
      const nextHandler = vi.fn();
      emitter.on('simple', asyncHandler);
      emitter.on('simple', nextHandler);

      expect(() => emitter.emit('simple')).not.toThrow();
      await new Promise(resolve => setTimeout(resolve));

      expect(nextHandler).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        'Error in event handler for "simple":',
        failure
      );
    });

    test('should be safe to remove handler during emit (copy handlers array)', () => {
      const handler1 = vi.fn();
      let unsubscribe2: () => void;
      const handler2 = vi.fn(() => {
        unsubscribe2();
      });
      const handler3 = vi.fn();

      emitter.on('simple', handler1);
      unsubscribe2 = emitter.on('simple', handler2);
      emitter.on('simple', handler3);

      emitter.emit('simple');

      // All handlers should be called during first emit
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // Second emit should not call handler2
      emitter.emit('simple');
      expect(handler1).toHaveBeenCalledTimes(2);
      expect(handler2).toHaveBeenCalledTimes(1); // Still 1
      expect(handler3).toHaveBeenCalledTimes(2);
    });

    test('emit() overhead is <1ms for 100 handlers', () => {
      // Register 100 handlers
      for (let i = 0; i < 100; i++) {
        emitter.on('simple', () => {});
      }

      const start = performance.now();
      emitter.emit('simple');
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1);
    });
  });

  describe('removeAllListeners()', () => {
    test('should remove all listeners for a specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const otherHandler = vi.fn();

      emitter.on('simple', handler1);
      emitter.on('simple', handler2);
      emitter.on('withArg', otherHandler);

      emitter.removeAllListeners('simple');
      emitter.emit('simple');
      emitter.emit('withArg', 'test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(otherHandler).toHaveBeenCalledTimes(1);
    });

    test('should remove all listeners when called without event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('simple', handler1);
      emitter.on('withArg', handler2);

      emitter.removeAllListeners();
      emitter.emit('simple');
      emitter.emit('withArg', 'test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    test('should do nothing if event has no listeners', () => {
      // Should not throw
      expect(() => emitter.removeAllListeners('simple')).not.toThrow();
    });
  });

  describe('type safety', () => {
    test('should enforce correct event types at compile time', () => {
      // These should compile without errors
      emitter.on('simple', () => {});
      emitter.on('withArg', (_value: string) => {});
      emitter.on(
        'withMultipleArgs',
        (_a: number, _b: string, _c: boolean) => {}
      );

      emitter.emit('simple');
      emitter.emit('withArg', 'test');
      emitter.emit('withMultipleArgs', 1, 'test', true);

      // Type checks pass
      expect(true).toBe(true);
    });
  });
});

describe('TypedEventEmitter emit while handlers change', () => {
  test('given a handler that removes a later handler during emit, when the event is emitted, then the removed handler is not called and the rest are', () => {
    // given
    const emitter = new TypedEventEmitter<TestEvents>();
    const laterHandler = vi.fn();
    const lastHandler = vi.fn();
    emitter.on('withArg', () => emitter.off('withArg', laterHandler));
    emitter.on('withArg', laterHandler);
    emitter.on('withArg', lastHandler);

    // test
    emitter.emit('withArg', 'first');

    // expect
    expect(laterHandler).not.toHaveBeenCalled();
    expect(lastHandler).toHaveBeenCalledWith('first');
  });

  test('given a handler that calls removeAllListeners during emit, when the event is emitted, then later handlers are not called', () => {
    // given
    const emitter = new TypedEventEmitter<TestEvents>();
    const laterHandler = vi.fn();
    emitter.on('simple', () => emitter.removeAllListeners());
    emitter.on('simple', laterHandler);

    // test
    emitter.emit('simple');

    // expect
    expect(laterHandler).not.toHaveBeenCalled();
  });

  test('given a handler that re-emits the event before a once handler, when the event is emitted, then the once handler is called exactly once', () => {
    // given
    const emitter = new TypedEventEmitter<TestEvents>();
    const onceHandler = vi.fn();
    let depth = 0;
    emitter.on('simple', () => {
      depth += 1;
      if (depth === 1) {
        emitter.emit('simple');
      }
    });
    emitter.once('simple', onceHandler);

    // test
    emitter.emit('simple');

    // expect
    expect(onceHandler).toHaveBeenCalledTimes(1);
  });
});
