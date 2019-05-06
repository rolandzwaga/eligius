// tslint:disable-next-line:export-just-namespace
export = ChronoTrigger;
export as namespace ChronoTrigger;

declare namespace ChronoTrigger {

    class TimelineEventNames {
        // timeline requests
        static PLAY_TOGGLE_REQUEST: string;
        static PLAY_REQUEST: string;
        static STOP_REQUEST: string;
        static PAUSE_REQUEST: string;
        static SEEK_REQUEST: string;
        static RESIZE_REQUEST: string;
        static CONTAINER_REQUEST: string;
        static DURATION_REQUEST: string;
    
        // timeline announcements
        static DURATION: string;
        static TIME: string;
        static SEEKED: string;
        static COMPLETE: string;
        static PLAY: string;
        static STOP: string;
        static PAUSE: string;
        static SEEK: string;
        static RESIZE: string;
        static POSITION_UPDATE: string;
        static TIME_UPDATE: string;
    
        // factory and engine events
        static REQUEST_INSTANCE: string;
        static REQUEST_ACTION: string;
        static REQUEST_FUNCTION: string;
        static REQUEST_TIMELINE_URI: string;
        static BEFORE_REQUEST_TIMELINE_URI: string;
        static REQUEST_ENGINE_ROOT: string;
        static REQUEST_CURRENT_TIMELINE_POSITION: string;
        static REQUEST_TIMELINE_CLEANUP: string;
        static EXECUTE_TIMELINEACTION: string;
        static RESIZE_TIMELINEACTION: string;
    
        //language manager events
        static REQUEST_LABEL_COLLECTION: string;
        static REQUEST_LABEL_COLLECTIONS: string;
        static REQUEST_CURRENT_LANGUAGE: string;
        static LANGUAGE_CHANGE: string;
    }
    
    class Eventbus {
        constructor();
        clear(): void;
        on(eventName: string, eventHandler: Function, eventTopic?: string): ()=>void;
        off(eventName: string, eventHandler: Function, eventTopic?: string): void;
        once(eventName: string, eventHandler: Function, eventTopic?: string): void;
        broadcast(eventName: string, args: any[]): void;
        broadcastForTopic(eventName: string, eventTopic: string, args: any[]): void;
        registerEventlistener(eventbusListener: IEventbusListener): void;
        registerInterceptor(eventName: string, interceptor: IEventInterceptor, eventTopic: string): void;
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
        init(): Promise<ITimelineProvider>;
        destroy() :void;
    }

    class ChronoTriggerEngine implements IChronoTriggerEngine {
        constructor(configuration: IConfiguration, eventbus: Eventbus, timelineProvider: ITimelineProvider);
        init(): Promise<ITimelineProvider>;
        destroy() :void;
    }

    interface ITimelineProvider {
        loop: boolean;
        providerid: string;
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

    interface ConfigurationResolver extends IConfigurationResolver {
        new(importer: IResourceImporter, eventbus: Eventbus): ConfigurationResolver;
    }
    class ConfigurationResolver{}

    class EngineFactory {
        constructor(importer: IResourceImporter, windowRef: Window, eventbus: Eventbus);
        createEngine(configuration: IConfiguration, resolver?: IConfigurationResolver): IChronoTriggerEngine;
        destroy():void;
    }

    interface WebpackResourceImporter extends IResourceImporter {}
    class WebpackResourceImporter{}
}
