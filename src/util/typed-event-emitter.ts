/**
 * Handler function for a specific event
 */
export type EventHandler<T extends unknown[]> = (...args: T) => void;

/**
 * Interface for a type-safe event emitter
 * @typeParam T - Event map object where keys are event names and values are argument tuples
 *
 * Note: Use `type` aliases (not `interface`) for your event maps to avoid
 * "Index signature is missing" errors. TypeScript treats them differently.
 */
export interface ITypedEventEmitter<T extends Record<keyof T, unknown[]>> {
  /**
   * Subscribe to an event
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;

  /**
   * Subscribe to an event for one-time execution
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Event handler to remove
   */
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;

  /**
   * Emit an event to all subscribers
   * @param event - Event name
   * @param args - Event arguments
   */
  emit<K extends keyof T>(event: K, ...args: T[K]): void;

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name. If not provided, removes all listeners.
   */
  removeAllListeners(event?: keyof T): void;
}

/**
 * Type-safe event emitter implementation
 *
 * Features:
 * - Generic type parameter for event map
 * - Handler execution order preserved (registration order)
 * - Errors in handlers caught and logged (don't break other handlers)
 * - Copy handlers array during emit (safe removal during iteration)
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   start: [];
 *   data: [value: string];
 *   progress: [current: number, total: number];
 * }
 *
 * const emitter = new TypedEventEmitter<MyEvents>();
 *
 * const unsubscribe = emitter.on('data', (value) => {
 *   console.log('Received:', value);
 * });
 *
 * emitter.emit('data', 'hello');
 * unsubscribe();
 * ```
 */
export class TypedEventEmitter<T extends Record<keyof T, unknown[]>>
  implements ITypedEventEmitter<T>
{
  private handlers: Map<keyof T, Array<EventHandler<T[keyof T]>>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const eventHandlers = this.handlers.get(event)!;
    eventHandlers.push(handler as EventHandler<T[keyof T]>);

    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event for one-time execution
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void {
    const onceHandler: EventHandler<T[K]> = (...args) => {
      this.off(event, onceHandler);
      handler(...args);
    };

    return this.on(event, onceHandler);
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Event handler to remove
   */
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) {
      return;
    }

    const index = eventHandlers.indexOf(handler as EventHandler<T[keyof T]>);
    if (index !== -1) {
      eventHandlers.splice(index, 1);
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * Features:
   * - Copies handlers array to allow safe removal during iteration
   * - Isolates errors - one failing handler doesn't break others
   * - Logs errors to console for debugging
   *
   * @param event - Event name
   * @param args - Event arguments
   */
  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers || eventHandlers.length === 0) {
      return;
    }

    // Copy array to allow safe removal during iteration
    const handlersCopy = [...eventHandlers];

    for (const handler of handlersCopy) {
      try {
        handler(...(args as T[keyof T]));
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name. If not provided, removes all listeners.
   */
  removeAllListeners(event?: keyof T): void {
    if (event !== undefined) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}
