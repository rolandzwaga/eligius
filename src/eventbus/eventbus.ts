import type {
  IEventbus,
  IEventbusErrorContext,
  IEventbusErrorReport,
  IEventbusInterceptor,
  IEventbusListener,
  IEventbusOptions,
  RequestMap,
  RequestName,
  TEventbusErrorHandler,
  TEventbusErrorSource,
  TEventbusRemover,
  TEventHandler,
  TRequestResponder,
  TTypedRequestResponder,
} from '@eventbus/types.ts';
import {isPromise} from '@util/guards/is-promise.ts';

/**
 * Maps each once() decorator to the handler it wraps, so off() can remove a
 * once() registration by the original function.
 */
const onceOriginals = new WeakMap<TEventHandler, TEventHandler>();

/**
 * Central event bus for pub/sub communication and synchronous request/response queries.
 *
 * The eventbus supports:
 * - **Pub/Sub**: `on()`, `once()`, `off()`, `broadcast()`, `broadcastForTopic()`
 * - **Request/Response**: `onRequest()`, `request()`, `requestForTopic()` for synchronous queries
 * - **Interceptors**: Transform event arguments before handlers receive them
 * - **Listeners**: Global event observers for logging/debugging
 *
 * @example Pub/Sub pattern
 * ```ts
 * const remover = eventbus.on('timeline-play', () => console.log('Playing'));
 * eventbus.broadcast('timeline-play', []);
 * remover(); // Unsubscribe
 * ```
 *
 * @example Request/Response pattern
 * ```ts
 * eventbus.onRequest('request-instance', (name) => new MyClass(name));
 * const instance = eventbus.request<MyClass>('request-instance', 'test');
 * ```
 *
 * Broadcasts isolate errors: a handler, listener or interceptor that throws, or
 * returns a promise that rejects, is reported and the others still run. Request
 * responders are not isolated; their errors reach the requester.
 *
 * @example Observing handler errors
 * ```ts
 * const eventbus = new Eventbus({
 *   onHandlerError: (error, {eventName, eventTopic, source}) =>
 *     myLogger.warn(`${source} failed for ${eventName}`, error),
 * });
 * ```
 */
export class Eventbus implements IEventbus {
  private eventHandlers = new Map<string, TEventHandler[]>();
  private eventInterceptors = new Map<string, IEventbusInterceptor[]>();
  private eventListeners: IEventbusListener[] = [];
  private requestResponders = new Map<string, TRequestResponder[]>();
  private readonly onHandlerError: TEventbusErrorHandler | undefined;

  /**
   * @param options - Optional settings. `onHandlerError` observes errors raised
   * by handlers, listeners and interceptors during a broadcast. It survives
   * {@link Eventbus.clear}.
   */
  constructor(options?: IEventbusOptions) {
    this.onHandlerError = options?.onHandlerError;
    this.clear();
  }

  /**
   * Clears all handlers, listeners, interceptors, and request responders.
   */
  clear() {
    this.eventHandlers = new Map<string, TEventHandler[]>();
    this.eventListeners = [];
    this.eventInterceptors = new Map<string, IEventbusInterceptor[]>();
    this.requestResponders = new Map<string, TRequestResponder[]>();
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
    // Remove the decorator before calling the handler, so a handler that
    // rebroadcasts the event or throws cannot make it fire more than once.
    // The flag covers a broadcast that already took a snapshot including it.
    let called = false;
    const eventHandlerDecorator = (...args: any[]) => {
      if (called) {
        return;
      }
      called = true;
      this.off(eventName, eventHandlerDecorator, eventTopic);
      // Return the result so a rejected promise from an async handler reaches
      // the dispatcher and gets reported.
      return eventHandler(...args);
    };
    // Lets off(eventName, eventHandler) find the decorator.
    onceOriginals.set(eventHandlerDecorator, eventHandler);
    this.on(eventName, eventHandlerDecorator, eventTopic);
    return () => {
      this.off(eventName, eventHandlerDecorator, eventTopic);
    };
  }

  /**
   * Removes one registration of the handler. A handler registered with
   * {@link Eventbus.once} can be removed by passing the original function. An
   * exact registration (through `on()`) is preferred over a `once()` one.
   */
  off(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ): void {
    const handlers = this._getEventHandlers(eventName, eventTopic);
    let idx = handlers.indexOf(eventHandler);
    if (idx === -1) {
      idx = handlers.findIndex(h => onceOriginals.get(h) === eventHandler);
    }
    if (idx > -1) {
      handlers.splice(idx, 1);
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
  onRequest(
    eventName: string,
    responder: TRequestResponder,
    eventTopic?: string
  ): TEventbusRemover {
    const responders = this._getRequestResponders(eventName, eventTopic);
    responders.push(responder);
    return () => {
      const index = responders.indexOf(responder);
      if (index > -1) {
        responders.splice(index, 1);
      }
    };
  }

  request<K extends RequestName>(
    eventName: K,
    ...args: RequestMap[K]['args']
  ): RequestMap[K]['returns'] | undefined;
  request<T>(eventName: string, ...args: unknown[]): T | undefined;
  request(eventName: string, ...args: unknown[]): unknown {
    return this._callResponder(eventName, undefined, args);
  }

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
  requestForTopic(
    eventName: string,
    eventTopic: string,
    ...args: unknown[]
  ): unknown {
    return this._callResponder(eventName, eventTopic, args);
  }

  private _getRequestResponders(
    eventName: string,
    eventTopic?: string
  ): TRequestResponder[] {
    if (eventTopic) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this.requestResponders.has(eventName)) {
      this.requestResponders.set(eventName, []);
    }
    return this.requestResponders.get(eventName) as TRequestResponder[];
  }

  private _callResponder<T>(
    eventName: string,
    eventTopic: string | undefined,
    args: unknown[]
  ): T | undefined {
    const responders = this._getRequestResponders(eventName, eventTopic);
    if (responders.length === 0) {
      return undefined;
    }
    // First responder wins
    return responders[0](...args) as T;
  }

  _callHandlers(
    eventName: string,
    eventTopic: string | undefined,
    args: any = []
  ): void {
    const handlers = this._getEventHandlers(eventName, eventTopic);

    if (handlers) {
      // Iterate snapshots: an interceptor, listener or handler that removes
      // itself (or an earlier one) during dispatch would otherwise make the
      // loop skip the entry that moves into the freed slot.
      const interceptors = this._getEventInterceptors(
        eventName,
        eventTopic
      ).slice();
      const listeners = this.eventListeners.slice();
      const snapshot = handlers.slice();

      // Each interceptor, listener and handler is isolated: one that throws is
      // reported and the rest still run, so a faulty controller cannot abort
      // dispatch or throw into the engine code that broadcast the event.
      for (const interceptor of interceptors) {
        try {
          args = interceptor.intercept(args);
        } catch (error) {
          this._reportError(error, eventName, eventTopic, 'interceptor');
        }
      }

      for (const listener of listeners) {
        try {
          this._watchResult(
            listener.handleEvent(eventName, eventTopic, args),
            eventName,
            eventTopic,
            'listener'
          );
        } catch (error) {
          this._reportError(error, eventName, eventTopic, 'listener');
        }
      }

      const hasArgs = args?.length > 0;
      for (const handler of snapshot) {
        try {
          this._watchResult(
            hasArgs ? handler(...args) : handler(),
            eventName,
            eventTopic,
            'handler'
          );
        } catch (error) {
          this._reportError(error, eventName, eventTopic, 'handler');
        }
      }
    }
  }

  /**
   * Handlers are typed to return void, but async ones return a promise that
   * nobody awaits. Report its rejection like a synchronous throw.
   */
  private _watchResult(
    result: unknown,
    eventName: string,
    eventTopic: string | undefined,
    source: TEventbusErrorSource
  ): void {
    if (result && isPromise(result)) {
      result.then(undefined, error =>
        this._reportError(error, eventName, eventTopic, source)
      );
    }
  }

  /**
   * Reports an error a component caught, the same way as a failing handler:
   * `console.error` naming the source, then the `onHandlerError` option with
   * source `'reported'`. Never throws.
   *
   * @param error - The caught error
   * @param context - The reporting component and, if any, the event it was
   * handling
   */
  reportError(error: unknown, context: IEventbusErrorReport): void {
    const {source, eventName} = context;
    const event = eventName ? ` for "${eventName}"` : '';
    console.error(`Error reported by ${source}${event}:`, error);
    this._notifyErrorHook(
      error,
      {
        eventName: eventName ?? '',
        eventTopic: undefined,
        source: 'reported',
        reporter: source,
      },
      `${source}${event}`
    );
  }

  /**
   * Logs the error with the event name and topic, never the event arguments
   * (they can carry configuration or user data), then passes it to the
   * `onHandlerError` option.
   */
  private _reportError(
    error: unknown,
    eventName: string,
    eventTopic: string | undefined,
    source: TEventbusErrorSource
  ): void {
    const topic = eventTopic ? ` (topic "${eventTopic}")` : '';
    console.error(
      `Error in eventbus ${source} for "${eventName}"${topic}:`,
      error
    );
    this._notifyErrorHook(
      error,
      {eventName, eventTopic, source},
      `"${eventName}"${topic}`
    );
  }

  private _notifyErrorHook(
    error: unknown,
    context: IEventbusErrorContext,
    description: string
  ): void {
    if (!this.onHandlerError) {
      return;
    }
    try {
      this.onHandlerError(error, context);
    } catch (hookError) {
      console.error(
        `Error in eventbus onHandlerError for ${description}:`,
        hookError
      );
    }
  }
}
