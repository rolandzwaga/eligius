export type TEventHandler = (...args: any[]) => void;
export type TEventHandlerRemover = () => void;

export interface IEventbus {
  clear(): void;
  on(eventName: string, eventHandler: TEventHandler, eventTopic?: string): TEventHandlerRemover;
  off(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void;
  once(eventName: string, eventHandler: Function, eventTopic?: string): void;
  broadcast(eventName: string, args?: any[]): void;
  broadcastForTopic(eventName: string, eventTopic: string, args?: any[]): void;
  registerEventlistener(eventbusListener: IEventbusListener): void;
  registerInterceptor(eventName: string, interceptor: IEventInterceptor, eventTopic?: string): void;
}

export interface IEventListener {
  handleEvent(eventName: string, eventTopic: string | undefined, args: any[]): void;
}

export interface IEventInterceptor {
  intercept(eventArgs: any[]): any[];
}
