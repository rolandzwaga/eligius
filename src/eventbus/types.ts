import type {EventMap, EventName} from './events/types.ts';

export type TEventHandler = (...args: any[]) => void;
export type TEventbusRemover = () => void;

export interface IEventbus {
  clear(): void;

  // Type-safe on() overloads
  on<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;
  on(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): TEventbusRemover;

  // Type-safe off() overloads
  off<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): void;
  off(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): void;

  // Type-safe once() overloads
  once<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;
  once(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): TEventbusRemover;

  // Type-safe broadcast overloads
  broadcast<E extends EventName>(eventName: E, args: EventMap[E]): void;
  broadcast(eventName: string, args?: any[]): void;

  // Type-safe broadcastForTopic overloads
  broadcastForTopic<E extends EventName>(
    eventName: E,
    eventTopic: string,
    args: EventMap[E]
  ): void;
  broadcastForTopic(eventName: string, eventTopic: string, args?: any[]): void;
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
