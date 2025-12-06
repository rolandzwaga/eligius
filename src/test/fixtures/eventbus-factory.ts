import type {
  IEventbus,
  TEventbusRemover,
  TEventHandler,
  TRequestResponder,
} from '@eventbus/types.js';
import {vi} from 'vitest';

/**
 * Creates a mock eventbus for testing controller event handling
 */
export function createMockEventbus(): IEventbus {
  const listeners = new Map<string, Set<TEventHandler>>();
  const requestResponders = new Map<string, TRequestResponder[]>();

  const mockEventbus: IEventbus = {
    clear: vi.fn(() => {
      listeners.clear();
      requestResponders.clear();
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
          mockEventbus.off(eventName as any, onceHandler);
        };
        return mockEventbus.on(eventName as any, onceHandler);
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
        mockEventbus.broadcast(eventName as any, args as any);
      }
    ),

    registerEventlistener: vi.fn((): TEventbusRemover => {
      return () => {}; // No-op remover
    }),

    registerInterceptor: vi.fn((): TEventbusRemover => {
      return () => {}; // No-op remover
    }),

    onRequest: vi.fn(
      <T>(
        eventName: string,
        responder: TRequestResponder<T>,
        eventTopic?: string
      ): TEventbusRemover => {
        const key = eventTopic ? `${eventName}:${eventTopic}` : eventName;
        if (!requestResponders.has(key)) {
          requestResponders.set(key, []);
        }
        requestResponders.get(key)!.push(responder);

        return () => {
          const responders = requestResponders.get(key);
          if (responders) {
            const index = responders.indexOf(responder);
            if (index > -1) {
              responders.splice(index, 1);
            }
          }
        };
      }
    ),

    request: vi.fn((eventName: string, ...args: unknown[]) => {
      const responders = requestResponders.get(eventName);
      if (!responders || responders.length === 0) {
        return undefined;
      }
      return responders[0](...args);
    }) as IEventbus['request'],

    requestForTopic: vi.fn(
      (eventName: string, eventTopic: string, ...args: unknown[]) => {
        const key = `${eventName}:${eventTopic}`;
        const responders = requestResponders.get(key);
        if (!responders || responders.length === 0) {
          return undefined;
        }
        return responders[0](...args);
      }
    ) as IEventbus['requestForTopic'],
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
