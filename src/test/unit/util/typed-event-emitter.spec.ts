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
