export type TEventHandler = (...args: any[]) => void;
export type TEventbusRemover = () => void;

export interface IEventbus {
  clear(): void;
  on(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): TEventbusRemover;
  off(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): void;
  once(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): TEventbusRemover;
  broadcast(eventName: string, args?: any[]): void;
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
