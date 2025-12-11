import {BaseController} from '@controllers/base-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import type {TOperationData} from '@operation/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';

// Concrete implementation for testing that exposes protected methods through public attach()
class TestController extends BaseController<TOperationData> {
  name = 'TestController';
  initCalled = false;
  attachCalled = false;

  // Store handlers to register during attach - allows testing addListener behavior
  private pendingListeners: Array<{
    eventName: string;
    handler: (...args: any[]) => void;
  }> = [];

  init(operationData: TOperationData): void {
    this.operationData = operationData;
    this.initCalled = true;
  }

  // Queue a listener to be added during attach()
  queueListener(eventName: string, handler: (...args: any[]) => void): void {
    this.pendingListeners.push({eventName, handler});
  }

  attach(eventbus: IEventbus): void {
    this.attachCalled = true;
    // Register all queued listeners using the protected addListener method
    this.pendingListeners.forEach(({eventName, handler}) => {
      this.addListener(eventbus, eventName as any, handler);
    });
  }

  // Expose attachMultiple for testing through a public wrapper
  attachWithMultiple(
    eventbus: IEventbus,
    listeners: Array<{eventName: string; handler: (...args: any[]) => void}>
  ): void {
    this.attachMultiple(eventbus, listeners);
  }
}

describe('BaseController', () => {
  let controller: TestController;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    controller = new TestController();
    mockEventbus = createMockEventbus();
  });

  describe('addListener (via attach)', () => {
    it('should register event handlers that get called on broadcast', () => {
      const handler = vi.fn();
      controller.queueListener('test-event', handler);

      controller.attach(mockEventbus);
      mockEventbus.broadcast('test-event' as any, ['arg1', 'arg2']);

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should bind handler to controller instance', () => {
      const testMethod = vi.fn(function (this: TestController) {
        expect(this).toBe(controller);
      });
      controller.queueListener('test-event', testMethod);

      controller.attach(mockEventbus);
      mockEventbus.broadcast('test-event' as any, []);

      expect(testMethod).toHaveBeenCalled();
    });

    it('should track multiple listeners for cleanup', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      controller.queueListener('event1', handler1);
      controller.queueListener('event2', handler2);

      controller.attach(mockEventbus);

      // Both handlers should be called
      mockEventbus.broadcast('event1' as any, []);
      mockEventbus.broadcast('event2' as any, []);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      // After detach, neither should be called
      controller.detach(mockEventbus);
      mockEventbus.broadcast('event1' as any, []);
      mockEventbus.broadcast('event2' as any, []);

      expect(handler1).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(handler2).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe('attachMultiple', () => {
    it('should attach multiple listeners at once', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      controller.attachWithMultiple(mockEventbus, [
        {eventName: 'event1', handler: handler1},
        {eventName: 'event2', handler: handler2},
        {eventName: 'event3', handler: handler3},
      ]);

      // Verify all handlers are registered and called
      mockEventbus.broadcast('event1' as any, []);
      mockEventbus.broadcast('event2' as any, []);
      mockEventbus.broadcast('event3' as any, []);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('should track all listeners for cleanup', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      controller.attachWithMultiple(mockEventbus, [
        {eventName: 'event1', handler: handler1},
        {eventName: 'event2', handler: handler2},
      ]);

      // Detach should remove all listeners
      controller.detach(mockEventbus);

      mockEventbus.broadcast('event1' as any, []);
      mockEventbus.broadcast('event2' as any, []);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('detach', () => {
    it('should remove all event listeners', () => {
      const handler = vi.fn();
      controller.queueListener('test-event', handler);

      controller.attach(mockEventbus);

      // Handler should be called before detach
      mockEventbus.broadcast('test-event' as any, []);
      expect(handler).toHaveBeenCalledTimes(1);

      // After detach, handler should not be called
      controller.detach(mockEventbus);
      mockEventbus.broadcast('test-event' as any, []);

      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should prevent memory leaks by removing all listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      controller.queueListener('event1', handler1);
      controller.queueListener('event2', handler2);
      controller.queueListener('event3', handler3);

      controller.attach(mockEventbus);
      controller.detach(mockEventbus);

      // None of the handlers should be called after detach
      mockEventbus.broadcast('event1' as any, []);
      mockEventbus.broadcast('event2' as any, []);
      mockEventbus.broadcast('event3' as any, []);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    it('should allow safe multiple detach calls', () => {
      const handler = vi.fn();
      controller.queueListener('test-event', handler);

      controller.attach(mockEventbus);
      controller.detach(mockEventbus);
      controller.detach(mockEventbus); // Second detach should not throw

      mockEventbus.broadcast('test-event' as any, []);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('IController implementation', () => {
    it('should implement required init method', () => {
      const operationData = {test: 'data'};
      controller.init(operationData);

      expect(controller.initCalled).toBe(true);
      expect(controller.operationData).toEqual(operationData);
    });

    it('should implement required attach method', () => {
      controller.attach(mockEventbus);

      expect(controller.attachCalled).toBe(true);
    });

    it('should have name property', () => {
      expect(controller.name).toBe('TestController');
    });
  });
});
