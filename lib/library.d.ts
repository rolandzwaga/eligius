// tslint:disable-next-line:export-just-namespace
export = ChronoTrigger;
export as namespace ChronoTrigger;

declare namespace ChronoTrigger {

    interface Eventbus {
        clear(): void;
        on(eventName: string, eventHandler: Function, eventTopic?: string): ()=>void;
        off(eventName: string, eventHandler: Function, eventTopic?: string): void;
        once(eventName: string, eventHandler: Function, eventTopic?: string): void;
        broadcast(eventName: string, args: any[]): void;
        broadcastForTopic(eventName: string, eventTopic: string, args: any[]): void;
        registerEventlistener(eventbusListener: EventbusListener): void;
        registerInterceptor(eventName: string, interceptor: EventInterceptor, eventTopic: string): void;
    }

    interface EventInterceptor {
        intercept(eventArgs: any[]): any[];
    }

    interface EventbusListener {
        handleEvent(eventName: string, eventTopic: string, args: any[]): void;
    }

    interface ResourceImporter {
        import(name: string): any;
    }

    interface Configuration {
        [name: string]: any;
    }

    interface ChronoTriggerEngine {
        new (configuration: Configuration, eventbus: Eventbus, timelineProvider: TimelineProvider): ChronoTriggerEngine;
        init(): Promise<TimelineProvider>;
        destroy() :void;
    }

    interface TimelineProvider {
        loop: boolean;
        playerid: string;
        stop(): void;
        start() : void;
        pause(): void;
        seek(position: number) : void;
        init(): Promise<any>;
        destroy() :void;
        on(eventName: string, eventHandler: Function): void;
        once(eventName: string, eventHandler: Function): void;
        playlistItem(index: number): void;
        getPosition(): number;
        getDuration(): number;
    }

    class EngineFactory {
        constructor(importer: ResourceImporter, windowRef: Window, eventbus: Eventbus);
        createEngine(configuration: Configuration): ChronoTriggerEngine;
        destroy():void;
    }

}