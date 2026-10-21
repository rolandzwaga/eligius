import type {IAction} from '@action/types.ts';
import type {EventMap, EventName} from '@eventbus/events/types.ts';
import type {TLanguageCode} from '../types.ts';

export type {EventMap, EventName};

export type TEventHandler = (...args: any[]) => void;
export type TEventbusRemover = () => void;
export type TRequestResponder<T = unknown> = (...args: any[]) => T;

/**
 * The request/response queries that Eligius itself answers through
 * {@link IEventbus.onRequest}, with the arguments each takes and the value it
 * returns. Querying one of these names with {@link IEventbus.request} (without
 * an explicit type argument) types the response, and registering a responder
 * for one with {@link IEventbus.onRequest} checks the responder's signature.
 *
 * The untyped string overloads remain for custom request names.
 *
 * @example
 * ```ts
 * const language = eventbus.request('request-current-language');
 * // language: TLanguageCode | undefined
 * const label = eventbus.request('request-translation', 'nav.home');
 * // label: string | undefined
 * ```
 */
export interface RequestMap {
  /** Current timeline position in seconds (answered by the engine adapter). */
  'request-current-timeline-position': {args: []; returns: number};
  /** Duration of the current timeline, if known. */
  'timeline-duration-request': {args: []; returns: number | undefined};
  /** DOM container of the current timeline, if any. */
  'timeline-container-request': {
    args: [];
    returns: JQuery<HTMLElement> | undefined;
  };
  /** The engine's root element. */
  'request-engine-root': {args: []; returns: JQuery<HTMLElement>};
  /** URI of the current timeline. */
  'timeline-request-current-timeline': {args: []; returns: string};
  /** The active locale (answered by the locale adapter). */
  'request-current-language': {args: []; returns: TLanguageCode};
  /** A translation for the key, see `ILocaleManager.t`. */
  'request-translation': {
    args: [key: string | string[], params?: Record<string, unknown>];
    returns: string;
  };
  /** A new instance of a registered controller (answered by EngineFactory). */
  'request-instance': {args: [systemName: string]; returns: unknown};
  /** A registered function, such as an operation (answered by EngineFactory). */
  'request-function': {args: [systemName: string]; returns: unknown};
  /** An action by name, or null when unknown (answered by EngineFactory). */
  'request-action': {args: [actionName: string]; returns: IAction | null};
}

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
 * The part of the dispatch path that raised an error during a broadcast.
 */
export type TEventbusErrorSource = 'handler' | 'listener' | 'interceptor';

/**
 * Describes where an error was raised during a broadcast. It deliberately
 * leaves out the event arguments, which may carry configuration or user data.
 */
export interface IEventbusErrorContext {
  /** The name of the event being broadcast. */
  eventName: string;
  /** The topic the event was broadcast for, if any. */
  eventTopic: string | undefined;
  /** Whether a handler, an eventbus listener or an interceptor failed. */
  source: TEventbusErrorSource;
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
