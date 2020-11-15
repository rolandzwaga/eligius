import { IEventbus, IEventbusInterceptor, IEventbusListener, TEventHandler, TEventHandlerRemover } from './types';
export declare class Eventbus implements IEventbus {
    private eventHandlers;
    private eventInterceptors;
    private eventListeners;
    constructor();
    clear(): void;
    _getEventInterceptors(eventName: string, eventTopic?: string): IEventbusInterceptor[];
    _getEventHandlers(eventName: string, eventTopic?: string): TEventHandler[];
    on(eventName: string, eventHandler: TEventHandler, eventTopic?: string): TEventHandlerRemover;
    once(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void;
    off(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void;
    broadcast(eventName: string, args: any[]): void;
    broadcastForTopic(eventName: string, eventTopic: string, args: any[]): void;
    registerEventlistener(eventbusListener: IEventbusListener): void;
    registerInterceptor(eventName: string, interceptor: IEventbusInterceptor, eventTopic?: string): void;
    _callHandlers(eventName: string, eventTopic: string | undefined, args?: any): void;
}
