// tslint:disable-next-line:export-just-namespace
export = ChronoTrigger;
export as namespace ChronoTrigger;

declare namespace ChronoTrigger {

    class Eventbus {
        constructor();
        clear(): void;
        on(eventName: string, eventHandler: Function, eventTopic?: string): ()=>void;
        off(eventName: string, eventHandler: Function, eventTopic?: string): void;
        once(eventName: string, eventHandler: Function, eventTopic?: string): void;
        broadcast(eventName: string, args: any[]): void;
        broadcastForTopic(eventName: string, eventTopic: string, args: any[]): void;
        registerEventlistener(eventbusListener: EventbusListener): void;
        registerInterceptor(eventName: string, interceptor: EventInterceptor, eventTopic: string): void;
    }

    interface IEventInterceptor {
        intercept(eventArgs: any[]): any[];
    }

    interface IEventbusListener {
        handleEvent(eventName: string, eventTopic: string, args: any[]): void;
    }

    interface IResourceImporter {
        import(name: string): any;
        getOperationNames(): string[];
        getControllerNames(): string[];
        getProviderNames(): string[];
    }

    interface IConfiguration {
        [name: string]: any;
    }

    interface IChronoTriggerEngine {
        init(): Promise<TimelineProvider>;
        destroy() :void;
    }

    class ChronoTriggerEngine implements IChronoTriggerEngine {
        constructor(configuration: Configuration, eventbus: Eventbus, timelineProvider: TimelineProvider);
        init(): Promise<TimelineProvider>;
        destroy() :void;
    }

    interface ITimelineProvider {
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

    interface IConfigurationResolver {
        process(actionRegistryListener: IEventbusListener, configuration: IConfiguration): any;
        importSystemEntry(systemName: string): any;
        initializeEventActions(actionRegistryListener: IEventbusListener, config: IConfiguration): void;
        initializeActions(config: IConfiguration, actionsLookup: any): void;
        initializeInitActions(config: IConfiguration, actionsLookup: any): void;
        initializeTimelineActions(config: IConfiguration): void;
        initializeTimelineAction(timelineConfig: any): void;
        resolveOperations(config: IConfiguration): void;
        processConfiguration(config: IConfiguration, parentConfig: IConfiguration): void;
        processConfigProperty(key: string, config: IConfiguration, parentConfig: IConfiguration): void;
    }

    interface ConfigurationResolver extends IConfigurationResolver {}
    class ConfigurationResolver{}

    class EngineFactory {
        constructor(importer: ResourceImporter, windowRef: Window, eventbus: Eventbus);
        createEngine(configuration: Configuration, resolver: IConfigurationResolver=null): ChronoTriggerEngine;
        destroy():void;
    }

    interface WebpackResourceImporter extends IResourceImporter {}
    class WebpackResourceImporter{}

}