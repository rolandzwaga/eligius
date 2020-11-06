import { IEventbus, IEventbusListener, TEventHandler, IEventbusInterceptor, TEventHandlerRemover } from './types';

class Eventbus implements IEventbus {
  private eventHandlers: Record<string, TEventHandler[]> = {};
  private eventInterceptors: Record<string, IEventbusInterceptor[]> = {};
  private eventListeners: IEventbusListener[] = [];

  constructor() {
    this.clear();
  }

  clear() {
    this.eventHandlers = {};
    this.eventListeners = [];
    this.eventInterceptors = {};
  }

  _getEventInterceptors(eventName: string, eventTopic?: string): IEventbusInterceptor[] {
    if (eventTopic && eventTopic.length) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this.eventInterceptors[eventName]) {
      this.eventInterceptors[eventName] = [];
    }
    return this.eventInterceptors[eventName];
  }

  _getEventHandlers(eventName: string, eventTopic?: string): TEventHandler[] {
    if (eventTopic && eventTopic.length) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    return this.eventHandlers[eventName];
  }

  on(eventName: string, eventHandler: TEventHandler, eventTopic?: string): TEventHandlerRemover {
    this._getEventHandlers(eventName, eventTopic).push(eventHandler);
    return () => {
      this.off(eventName, eventHandler, eventTopic);
    };
  }

  once(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void {
    const eventHandlerDecorator = () => {
      eventHandler(...arguments);
      this.off(eventName, eventHandlerDecorator, eventTopic);
    };
    this.on(eventName, eventHandlerDecorator, eventTopic);
  }

  off(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void {
    const handlers = this._getEventHandlers(eventName, eventTopic);
    if (handlers) {
      const idx = handlers.indexOf(eventHandler);
      if (idx > -1) {
        handlers.splice(idx, 1);
      }
    }
  }

  broadcast(eventName: string, args: any[]): void {
    this._callHandlers(eventName, undefined, args);
  }

  broadcastForTopic(eventName: string, eventTopic: string, args: any[]): void {
    this._callHandlers(eventName, eventTopic, args);
  }

  registerEventlistener(eventbusListener: IEventbusListener): void {
    this.eventListeners.push(eventbusListener);
  }

  registerInterceptor(eventName: string, interceptor: IEventbusInterceptor, eventTopic?: string): void {
    const interceptors = this._getEventInterceptors(eventName, eventTopic);
    interceptors.push(interceptor);
  }

  _callHandlers(eventName: string, eventTopic: string | undefined, args: any = []): void {
    const handlers = this._getEventHandlers(eventName, eventTopic);

    if (handlers) {
      const interceptors = this._getEventInterceptors(eventName, eventTopic);

      interceptors.forEach((interceptor) => {
        args = interceptor.intercept(args);
      });

      this.eventListeners.forEach((listener: IEventbusListener) => {
        listener.handleEvent(eventName, eventTopic, args);
      });

      if (args.length) {
        handlers.forEach((handler: TEventHandler) => handler(...args));
      } else {
        handlers.forEach((handler: TEventHandler) => handler());
      }
    }
  }
}

export default Eventbus;
