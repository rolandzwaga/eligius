import type {EventMap, EventName, RequestMap} from '@eventbus/events/types.ts';

/**
 * `RequestMap` (the typed request/response queries) is generated from the
 * request event interfaces by `npm run events-metadata`; see
 * `src/eventbus/events/types.ts`.
 */
export type {EventMap, EventName, RequestMap};

export type TEventHandler = (...args: any[]) => void;
export type TEventbusRemover = () => void;
export type TRequestResponder<T = unknown> = (...args: any[]) => T;

/**
 * Names of the request/response queries declared in {@link RequestMap}.
 */
export type RequestName = keyof RequestMap;

/**
 * Responder signature for a request declared in {@link RequestMap}.
 */
export type TTypedRequestResponder<K extends RequestName> = (
  ...args: RequestMap[K]['args']
) => RequestMap[K]['returns'];

/**
 * The part of the dispatch path that raised an error during a broadcast, or
 * `'reported'` for an error a component passed to
 * {@link IEventbus.reportError}.
 */
export type TEventbusErrorSource =
  | 'handler'
  | 'listener'
  | 'interceptor'
  | 'reported';

/**
 * Describes who reports an error through {@link IEventbus.reportError}.
 */
export interface IEventbusErrorReport {
  /** The reporting component, such as `'DOMEventListenerController'`. */
  source: string;
  /** The eventbus event being handled when the error occurred, if any. */
  eventName?: string;
}

/**
 * Describes where an error was raised during a broadcast. It deliberately
 * leaves out the event arguments, which may carry configuration or user data.
 */
export interface IEventbusErrorContext {
  /**
   * The name of the event being broadcast. For a reported error, the event
   * named in the report, or an empty string.
   */
  eventName: string;
  /** The topic the event was broadcast for, if any. */
  eventTopic: string | undefined;
  /**
   * Whether a handler, an eventbus listener or an interceptor failed, or
   * `'reported'` for an error passed to {@link IEventbus.reportError}.
   */
  source: TEventbusErrorSource;
  /** For a reported error: the component that reported it. */
  reporter?: string;
}

/**
 * Receives errors raised by handlers, listeners and interceptors during a
 * broadcast, including rejections of promises they return.
 *
 * @param error - The thrown value or rejection reason
 * @param context - The event name, topic and failing part of the dispatch path
 */
export type TEventbusErrorHandler = (
  error: unknown,
  context: IEventbusErrorContext
) => void;

/**
 * Options for the `Eventbus` constructor.
 */
export interface IEventbusOptions {
  /**
   * Called for every error raised by a handler, listener or interceptor during
   * a broadcast, in addition to the `console.error` report. Errors thrown by
   * this callback are logged and otherwise ignored.
   *
   * Do not rethrow from it, and take care when broadcasting from it on the same
   * eventbus: a handler of that broadcast that throws reports back into this
   * callback.
   */
  onHandlerError?: TEventbusErrorHandler;
}

export interface IEventbus {
  clear(): void;

  on<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;

  /**
   * Removes one registration of the handler. A handler registered with
   * {@link IEventbus.once} can be removed by passing the original function;
   * an exact `on()` registration of the same function is removed first.
   *
   * @param eventName - The event name
   * @param eventHandler - The handler that was registered
   * @param eventTopic - The topic it was registered for, if any
   */
  off<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): void;

  once<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;

  /**
   * Broadcast an event to its interceptors, the eventbus listeners and its
   * handlers, in that order.
   *
   * Errors are isolated: a handler, listener or interceptor that throws (or
   * returns a promise that rejects) is reported through `console.error` and
   * the `onHandlerError` option, and the remaining ones still run. A failing
   * interceptor leaves the arguments as they were before it ran. This method
   * never throws because of them.
   *
   * @param eventName - The event name
   * @param args - The event arguments
   */
  broadcast<E extends EventName>(eventName: E, args: EventMap[E]): void;

  /**
   * Broadcast an event for a specific topic. Errors are isolated the same way
   * as in {@link IEventbus.broadcast}.
   *
   * @param eventName - The event name
   * @param eventTopic - The topic to target
   * @param args - The event arguments
   */
  broadcastForTopic<E extends EventName>(
    eventName: E,
    eventTopic: string,
    args: EventMap[E]
  ): void;

  /**
   * Register a responder for synchronous request/response queries.
   * Only the first registered responder for an event will be called.
   *
   * For a name declared in {@link RequestMap} the responder's arguments and
   * return value are type checked.
   *
   * @param eventName - The request event name
   * @param responder - Function that returns the response value
   * @param eventTopic - Optional topic for topic-specific responders
   * @returns Function to unregister the responder
   */
  onRequest<K extends RequestName>(
    eventName: K,
    responder: TTypedRequestResponder<K>,
    eventTopic?: string
  ): TEventbusRemover;
  onRequest<T>(
    eventName: string,
    responder: TRequestResponder<T>,
    eventTopic?: string
  ): TEventbusRemover;

  /**
   * Send a synchronous request and get an immediate response.
   * Returns undefined if no responder is registered.
   *
   * For a name declared in {@link RequestMap}, called without an explicit
   * type argument, the response is typed from the map.
   *
   * Unlike a broadcast, an error thrown by the responder is not caught: it
   * propagates to the caller, which needs the response and has no other way
   * to tell a failure from an `undefined` answer.
   *
   * @param eventName - The request event name
   * @param args - Arguments to pass to the responder
   * @returns The response value, or undefined if no responder
   * @throws Whatever the responder throws
   */
  request<K extends RequestName>(
    eventName: K,
    ...args: RequestMap[K]['args']
  ): RequestMap[K]['returns'] | undefined;
  request<T>(eventName: string, ...args: unknown[]): T | undefined;

  /**
   * Send a synchronous request for a specific topic.
   * Returns undefined if no responder is registered for that topic.
   * Errors thrown by the responder propagate to the caller, as in
   * {@link IEventbus.request}.
   *
   * @param eventName - The request event name
   * @param eventTopic - The topic to target
   * @param args - Arguments to pass to the responder
   * @returns The response value, or undefined if no responder
   * @throws Whatever the responder throws
   */
  requestForTopic<K extends RequestName>(
    eventName: K,
    eventTopic: string,
    ...args: RequestMap[K]['args']
  ): RequestMap[K]['returns'] | undefined;
  requestForTopic<T>(
    eventName: string,
    eventTopic: string,
    ...args: unknown[]
  ): T | undefined;

  /**
   * Reports an error that a component caught and does not rethrow, such as
   * an action that failed in a controller's DOM event handler. It goes the
   * same way as a failing broadcast handler: `console.error` naming the
   * source, then the `onHandlerError` option with source `'reported'`. It
   * never throws.
   *
   * Optional, so existing `IEventbus` implementations still type check; the
   * built-in {@link Eventbus} implements it. Callers fall back to
   * `console.error` when it is missing.
   *
   * @param error - The caught error
   * @param context - The reporting component and, if any, the eventbus event
   * it was handling
   */
  reportError?(error: unknown, context: IEventbusErrorReport): void;

  registerEventlistener(eventbusListener: IEventbusListener): TEventbusRemover;
  registerInterceptor(
    eventName: string,
    interceptor: IEventbusInterceptor,
    eventTopic?: string
  ): TEventbusRemover;
}

export interface IEventbusListener {
  /**
   * Called for every broadcast event.
   *
   * May return a promise; the Eventbus does not await it, but reports a
   * rejection the same way as a thrown error.
   */
  handleEvent(
    eventName: string,
    eventTopic: string | undefined,
    args: any[]
  ): void | Promise<unknown>;
}

export interface IEventbusInterceptor {
  intercept(eventArgs: any[]): any[];
}
