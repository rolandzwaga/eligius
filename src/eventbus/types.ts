import type {EventMap, EventName} from '@eventbus/events/types.ts';

export type {EventMap, EventName};

export type TEventHandler = (...args: any[]) => void;
export type TEventbusRemover = () => void;
export type TRequestResponder<T = unknown> = (...args: any[]) => T;

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

  broadcast<E extends EventName>(eventName: E, args: EventMap[E]): void;

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
   * @param eventName - The request event name
   * @param args - Arguments to pass to the responder
   * @returns The response value, or undefined if no responder
   */
  request<T>(eventName: string, ...args: unknown[]): T | undefined;

  /**
   * Send a synchronous request for a specific topic.
   * Returns undefined if no responder is registered for that topic.
   *
   * @param eventName - The request event name
   * @param eventTopic - The topic to target
   * @param args - Arguments to pass to the responder
   * @returns The response value, or undefined if no responder
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
