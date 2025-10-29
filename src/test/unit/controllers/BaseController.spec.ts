import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BaseController} from '../../../controllers/base-controller.js';
import type {IEventbus} from '../../../eventbus/types.js';
import type {TOperationData} from '../../../operation/types.js';
import {createMockEventbus} from '../../fixtures/eventbus-factory.js';

// Concrete implementation for testing
class TestController extends BaseController<TOperationData> {
  name = 'TestController';
  initCalled = false;
  attachCalled = false;

  init(operationData: TOperationData): void {
    this.operationData = operationData;
    this.initCalled = true;
  }

  attach(eventbus: IEventbus): void {
    this.attachCalled = true;
  }
}

describe('BaseController', () => {
  let controller: TestController;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    controller = new TestController();
    mockEventbus = createMockEventbus();
  });

  describe('addListener', () => {
    it('should track remover functions', () => {
      // @ts-expect-error - accessing protected method for testing
      controller.addListener(mockEventbus, 'test-event', () => {});

      // @ts-expect-error - accessing protected property
      expect(controller.eventListeners).toHaveLength(1);
    });

    it('should bind handler to controller instance', () => {
      const testMethod = vi.fn(function (this: TestController) {
        expect(this).toBe(controller);
      });

      // @ts-expect-error - accessing protected method
      controller.addListener(mockEventbus, 'test-event', testMethod);

      // Trigger the event
      mockEventbus.broadcast('test-event');

      expect(testMethod).toHaveBeenCalled();
    });
  });

  describe('attachMultiple', () => {
    it('should attach multiple listeners at once', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      // @ts-expect-error - accessing protected method
      controller.attachMultiple(mockEventbus, [
        {eventName: 'event1', handler: handler1},
        {eventName: 'event2', handler: handler2},
        {eventName: 'event3', handler: handler3},
      ]);

      // @ts-expect-error - accessing protected property
      expect(controller.eventListeners).toHaveLength(3);

      // Verify all handlers registered
      mockEventbus.broadcast('event1');
      mockEventbus.broadcast('event2');
      mockEventbus.broadcast('event3');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });

  describe('detach', () => {
    it('should call all remover functions', () => {
      const remover1 = vi.fn();
      const remover2 = vi.fn();

      // @ts-expect-error - accessing protected property
      controller.eventListeners = [remover1, remover2];

      controller.detach(mockEventbus);

      expect(remover1).toHaveBeenCalled();
      expect(remover2).toHaveBeenCalled();
    });

    it('should clear the listener array', () => {
      // @ts-expect-error - accessing protected property
      controller.eventListeners = [vi.fn(), vi.fn()];

      controller.detach(mockEventbus);

      // @ts-expect-error - accessing protected property
      expect(controller.eventListeners).toHaveLength(0);
    });

    it('should prevent memory leaks by removing all listeners', () => {
      const handler = vi.fn();

      // @ts-expect-error - accessing protected method
      controller.addListener(mockEventbus, 'test-event', handler);

      // Detach should remove the listener
      controller.detach(mockEventbus);

      // Broadcast after detach should not call handler
      mockEventbus.broadcast('test-event');

      // Handler should only have been called 0 times (never after detach)
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
