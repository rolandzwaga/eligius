import { IEventbus, IEventListener, TEventHandler, IEventInterceptor, TEventHandlerRemover } from './types';
declare class Eventbus implements IEventbus {
    #private;
    constructor();
    clear(): void;
    _getEventInterceptors(eventName: string, eventTopic?: string): IEventInterceptor[];
    _getEventHandlers(eventName: string, eventTopic?: string): TEventHandler[];
    on(eventName: string, eventHandler: TEventHandler, eventTopic?: string): TEventHandlerRemover;
    once(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void;
    off(eventName: string, eventHandler: TEventHandler, eventTopic?: string): void;
    broadcast(eventName: string, args: any[]): void;
    broadcastForTopic(eventName: string, eventTopic: string, args: any[]): void;
    registerEventlistener(eventbusListener: IEventListener): void;
    registerInterceptor(eventName: string, interceptor: IEventInterceptor, eventTopic?: string): void;
    _callHandlers(eventName: string, eventTopic: string | undefined, args?: any): void;
}
export default Eventbus;
