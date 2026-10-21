import type {EventMap, EventName} from '@eventbus/events/types.ts';

export type {EventMap, EventName};

export type TEventHandler = (...args: any[]) => void;
export type TEventbusRemover = () => void;
export type TRequestResponder<T = unknown> = (...args: any[]) => T;

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
   * @param eventName - The request event name
   * @param responder - Function that returns the response value
   * @param eventTopic - Optional topic for topic-specific responders
   * @returns Function to unregister the responder
   */
  onRequest<T>(
    eventName: string,
    responder: TRequestResponder<T>,
    eventTopic?: string
  ): TEventbusRemover;

  /**
   * Send a synchronous request and get an immediate response.
   * Returns undefined if no responder is registered.
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
  handleEvent(
    eventName: string,
    eventTopic: string | undefined,
    args: any[]
  ): void;
}

export interface IEventbusInterceptor {
  intercept(eventArgs: any[]): any[];
}
