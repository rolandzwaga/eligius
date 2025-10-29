import {vi} from 'vitest';
import type {
  IEventbus,
  TEventbusRemover,
  TEventHandler,
} from '../../eventbus/types.js';

/**
 * Creates a mock eventbus for testing controller event handling
 */
export function createMockEventbus(): IEventbus {
  const listeners = new Map<string, Set<TEventHandler>>();

  const mockEventbus: IEventbus = {
    clear: vi.fn(() => {
      listeners.clear();
    }),

    on: vi.fn(
      (eventName: string, eventHandler: TEventHandler): TEventbusRemover => {
        if (!listeners.has(eventName)) {
          listeners.set(eventName, new Set());
        }
        listeners.get(eventName)!.add(eventHandler);

        // Return remover function
        return () => {
          listeners.get(eventName)?.delete(eventHandler);
        };
      }
    ),

    off: vi.fn((eventName: string, eventHandler: TEventHandler) => {
      listeners.get(eventName)?.delete(eventHandler);
    }),

    once: vi.fn(
      (eventName: string, eventHandler: TEventHandler): TEventbusRemover => {
        const onceHandler: TEventHandler = (...args: any[]) => {
          eventHandler(...args);
          mockEventbus.off(eventName, onceHandler);
        };
        return mockEventbus.on(eventName, onceHandler);
      }
    ),

    broadcast: vi.fn((eventName: string, args?: any[]) => {
      const handlers = listeners.get(eventName);
      if (handlers) {
        handlers.forEach(handler => handler(...(args || [])));
      }
    }),

    broadcastForTopic: vi.fn(
      (eventName: string, _eventTopic: string, args?: any[]) => {
        // Simple implementation for testing
        mockEventbus.broadcast(eventName, args);
      }
    ),

    registerEventlistener: vi.fn((): TEventbusRemover => {
      return () => {}; // No-op remover
    }),

    registerInterceptor: vi.fn((): TEventbusRemover => {
      return () => {}; // No-op remover
    }),
  };

  return mockEventbus;
}

/**
 * Helper to verify event listener was registered
 */
export function getEventListenerCount(
  mockEventbus: IEventbus,
  eventName: string
): number {
  const onMock = mockEventbus.on as any;
  return onMock.mock.calls.filter((call: any[]) => call[0] === eventName)
    .length;
}
