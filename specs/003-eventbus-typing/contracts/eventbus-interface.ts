/**
 * Contract: Type-Safe EventBus Interface
 *
 * Defines the type-safe API contract for the EventBus.
 * This contract ensures event names are correctly associated with their argument types.
 */

/**
 * Union type of all valid event names.
 * Generated from EventMap keys.
 */
export type EventName = keyof EventMap;

/**
 * Mapping of event names to their argument tuple types.
 * Generated from all event interface definitions.
 */
export type EventMap = {
  [K in AllEvents as K['name']]: K['args'];
};

/**
 * Union of all event interfaces.
 * Used to construct EventMap.
 */
export type AllEvents = TimelinePlayRequestEvent | TimelineSeekRequestEvent;
// ... all other event interfaces

/**
 * Type-safe EventBus interface.
 *
 * Key contracts:
 * - Event names MUST be from EventName union (compile-time validated)
 * - Handler args MUST match EventMap[E] for event E (compile-time validated)
 * - Broadcast args MUST match EventMap[E] for event E (compile-time validated)
 * - Topics remain untyped strings (user-defined at runtime)
 * - Zero runtime overhead (types erased at compile-time)
 */
export interface IEventbus {
  /**
   * Clear all event handlers and listeners.
   * Runtime behavior unchanged from current implementation.
   */
  clear(): void;

  /**
   * Register an event handler.
   *
   * @template E - Event name type (inferred from eventName parameter)
   * @param eventName - Event name (must be in EventName union)
   * @param eventHandler - Handler function with args matching EventMap[E]
   * @param eventTopic - Optional topic for namespacing (user-defined string)
   * @returns Function to remove this handler
   *
   * CONTRACT:
   * - eventName MUST be literal from EventName union
   * - eventHandler args MUST match EventMap[E] exactly
   * - TypeScript infers E and enforces arg types
   *
   * @example
   * ```typescript
   * // Correct: TypeScript infers E = 'timeline-seek-request'
   * // Handler args typed as (position: number) => void
   * eventbus.on('timeline-seek-request', (position) => {
   *   console.log('Seeking to:', position); // position is number
   * });
   *
   * // Error: Invalid event name
   * eventbus.on('invalid-event', () => {}); // ❌ TypeScript error
   *
   * // Error: Wrong arg types
   * eventbus.on('timeline-seek-request', (pos: string) => {}); // ❌ TypeScript error
   * ```
   */
  on<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;

  /**
   * Remove an event handler.
   *
   * @template E - Event name type (inferred from eventName parameter)
   * @param eventName - Event name (must be in EventName union)
   * @param eventHandler - Handler function to remove
   * @param eventTopic - Optional topic
   *
   * CONTRACT: Same as on()
   */
  off<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): void;

  /**
   * Register a one-time event handler.
   * Handler automatically removed after first invocation.
   *
   * @template E - Event name type (inferred from eventName parameter)
   * @param eventName - Event name (must be in EventName union)
   * @param eventHandler - Handler function with args matching EventMap[E]
   * @param eventTopic - Optional topic
   * @returns Function to remove this handler before invocation
   *
   * CONTRACT: Same as on()
   */
  once<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;

  /**
   * Broadcast an event to all registered handlers.
   *
   * @template E - Event name type (inferred from eventName parameter)
   * @param eventName - Event name (must be in EventName union)
   * @param args - Event arguments matching EventMap[E]
   *
   * CONTRACT:
   * - eventName MUST be literal from EventName union
   * - args MUST match EventMap[E] exactly (as array)
   * - TypeScript infers E and enforces arg types
   *
   * @example
   * ```typescript
   * // Correct: args match EventMap['timeline-seek-request']
   * eventbus.broadcast('timeline-seek-request', [5.0]);
   *
   * // Correct: empty array for events with no args
   * eventbus.broadcast('timeline-play-request', []);
   *
   * // Error: Invalid event name
   * eventbus.broadcast('invalid-event', []); // ❌ TypeScript error
   *
   * // Error: Wrong arg types
   * eventbus.broadcast('timeline-seek-request', ['5.0']); // ❌ TypeScript error (string not number)
   *
   * // Error: Wrong arg count
   * eventbus.broadcast('timeline-seek-request', []); // ❌ TypeScript error (missing position)
   * ```
   */
  broadcast<E extends EventName>(eventName: E, args: EventMap[E]): void;

  /**
   * Broadcast an event to handlers registered for a specific topic.
   *
   * @template E - Event name type (inferred from eventName parameter)
   * @param eventName - Event name (must be in EventName union)
   * @param eventTopic - Topic string
   * @param args - Event arguments matching EventMap[E]
   *
   * CONTRACT: Same as broadcast()
   */
  broadcastForTopic<E extends EventName>(
    eventName: E,
    eventTopic: string,
    args: EventMap[E]
  ): void;

  /**
   * Register a global event listener (observes all events).
   * Runtime behavior unchanged from current implementation.
   */
  registerEventlistener(eventbusListener: IEventbusListener): TEventbusRemover;

  /**
   * Register an interceptor for an event.
   * Interceptors can modify args before handlers receive them.
   * Runtime behavior unchanged from current implementation.
   */
  registerInterceptor<E extends EventName>(
    eventName: E,
    interceptor: IEventbusInterceptor,
    eventTopic?: string
  ): TEventbusRemover;
}

/**
 * Function to remove an event handler.
 * Call this function to unregister the handler.
 */
export type TEventbusRemover = () => void;

/**
 * Event handler function signature.
 * Args type determined by EventMap[E] for event E.
 */
export type TEventHandler<E extends EventName = EventName> = (
  ...args: EventMap[E]
) => void;

/**
 * Global event listener (observes all events).
 * Not type-safe - receives raw event data.
 */
export interface IEventbusListener {
  handleEvent(
    eventName: string,
    eventTopic: string | undefined,
    args: any[]
  ): void;
}

/**
 * Event interceptor (modifies event args).
 * Not type-safe - receives/returns raw args.
 */
export interface IEventbusInterceptor {
  intercept(eventArgs: any[]): any[];
}

/**
 * CONTRACT GUARANTEES:
 *
 * 1. COMPILE-TIME TYPE SAFETY:
 *    - Invalid event names rejected by TypeScript
 *    - Incorrect handler args rejected by TypeScript
 *    - Incorrect broadcast args rejected by TypeScript
 *
 * 2. IDE SUPPORT:
 *    - Autocomplete for event names
 *    - Type inference for handler parameters
 *    - Type checking for broadcast arguments
 *
 * 3. RUNTIME BEHAVIOR:
 *    - Zero overhead (types erased at compile-time)
 *    - Existing EventBus implementation unchanged
 *    - All current tests pass without modification
 *    - Topics remain untyped (user-defined)
 *
 * 4. BREAKING CHANGES:
 *    - TimelineEventNames class deprecated
 *    - Direct string literals replace TimelineEventNames.X
 *    - Requires major version bump
 *
 * 5. BACKWARD COMPATIBILITY:
 *    - EventBus class implementation unchanged
 *    - Only interface signature changes
 *    - Runtime behavior identical
 */
