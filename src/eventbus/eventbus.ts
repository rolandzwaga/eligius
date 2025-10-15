import type {
  IEventbus,
  IEventbusInterceptor,
  IEventbusListener,
  TEventbusRemover,
  TEventHandler,
} from './types.ts';

export class Eventbus implements IEventbus {
  private eventHandlers = new Map<string, TEventHandler[]>();
  private eventInterceptors = new Map<string, IEventbusInterceptor[]>();
  private eventListeners: IEventbusListener[] = [];

  constructor() {
    this.clear();
  }

  clear() {
    this.eventHandlers = new Map<string, TEventHandler[]>();
    this.eventListeners = [];
    this.eventInterceptors = new Map<string, IEventbusInterceptor[]>();
  }

  _getEventInterceptors(
    eventName: string,
    eventTopic?: string
  ): IEventbusInterceptor[] {
    if (eventTopic) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this.eventInterceptors.has(eventName)) {
      this.eventInterceptors.set(eventName, []);
    }
    return this.eventInterceptors.get(eventName) as IEventbusInterceptor[];
  }

  _getEventHandlers(eventName: string, eventTopic?: string): TEventHandler[] {
    if (eventTopic) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    return this.eventHandlers.get(eventName) as TEventHandler[];
  }

  on(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): TEventbusRemover {
    this._getEventHandlers(eventName, eventTopic).push(eventHandler);
    return () => {
      this.off(eventName, eventHandler, eventTopic);
    };
  }

  once(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): TEventbusRemover {
    const eventHandlerDecorator = (...args: any[]) => {
      eventHandler(...args);
      this.off(eventName, eventHandlerDecorator, eventTopic);
    };
    this.on(eventName, eventHandlerDecorator, eventTopic);
    return () => {
      this.off(eventName, eventHandlerDecorator, eventTopic);
    };
  }

  off(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): void {
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

  registerEventlistener(eventbusListener: IEventbusListener): TEventbusRemover {
    this.eventListeners.push(eventbusListener);
    return () => {
      const index = this.eventListeners.indexOf(eventbusListener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  registerInterceptor(
    eventName: string,
    interceptor: IEventbusInterceptor,
    eventTopic?: string
  ): TEventbusRemover {
    const interceptors = this._getEventInterceptors(eventName, eventTopic);
    interceptors.push(interceptor);
    return () => {
      const index = interceptors.indexOf(interceptor);
      if (index > -1) {
        interceptors.splice(index, 1);
      }
    };
  }

  _callHandlers(
    eventName: string,
    eventTopic: string | undefined,
    args: any = []
  ): void {
    const handlers = this._getEventHandlers(eventName, eventTopic);

    if (handlers) {
      const interceptors = this._getEventInterceptors(eventName, eventTopic);

      interceptors.forEach(interceptor => {
        args = interceptor.intercept(args);
      });

      this.eventListeners.forEach((listener: IEventbusListener) => {
        listener.handleEvent(eventName, eventTopic, args);
      });

      if (args?.length) {
        handlers.forEach((handler: TEventHandler) => handler(...args));
      } else {
        handlers.forEach((handler: TEventHandler) => handler());
      }
    }
  }
}
