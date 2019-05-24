// tslint:disable-next-line:export-just-namespace
export = ChronoTrigger;
export as namespace ChronoTrigger;

declare namespace ChronoTrigger {

    class BaseActionCreator<T> {
        addStartOperation(systemName: string, operationData: IOperationData): T;
        next(): ActionCreatorFactory;
    }
    class BaseEndableActionCreator<T> extends BaseActionCreator<T> {
        addEndOperation(systemName: string, operationData: IOperationData): T;
    }

    class BaseTimelineActionCreator<T> extends BaseEndableActionCreator<T> {
        addDuration(start: number, end?: number): T;
    }

    class ActionCreator extends BaseActionCreator<ActionCreator> { }
    class EndableActionCreator extends BaseEndableActionCreator<EndableActionCreator> {}
    class TimelineActionCreator extends BaseTimelineActionCreator<TimelineActionCreator> {}

    class ActionCreatorFactory {
        createAction(name: string): ActionCreator;
        createInitAction(name: string): EndableActionCreator;
        createEventAction(name: string): ActionCreator;
        createTimelineAction(uri: string, name: string): TimelineActionCreator;
        end(): ConfigurationFactory;
    }

    class ConfigurationFactory {
        constructor(configuration?: IConfiguration);
        init(defaultLanguage: string): ConfigurationFactory;
        addTimelineSettings(selector: string, systemName: string): ConfigurationFactory;
        addLanguage(code: string, languageLabel: string): ConfigurationFactory;
        addTimeline(type: TimelineType, duration: number, uri: string, loop: boolean, selector: string): ConfigurationFactory;
        createAction(name: string): ActionCreator;
        createInitAction(name: string): EndableActionCreator;
        createEventAction(name: string): ActionCreator;
        createTimelineAction(uri: string, name: string): TimelineActionCreator;
        removeTimeline(uri: string): ConfigurationFactory;
        addLabel(id: string, code: string, translation: string): ConfigurationFactory;
        editAction(id: string): ActionEditor;
        editEventAction(id: string): ActionEditor;
        editInitAction(id: string): EndableActionEditor;
        editTimelineAction(uri: string, id: string): TimelineActionEditor;
    }

    class OperationEditor<T> {
        setSystemName(systemName: string): OperationEditor;
        setOperationData(operationData: IOperationData): OperationEditor;
        next(): T;
    }

    class BaseActionEditor<T> {
        setName(name: string): T;
        editStartOperation(id: string): OperationEditor<T>;
        removeStartOperation(id: string): T;
    }
    class BaseEndableActionEditor<T> extends BaseActionEditor<T> {
        editEndOperation(id: string): OperationEditor<T>;
        removeEndOperation(id: string): T;
    }

    class BaseTimelineActionEditor<T> extends BaseEndableActionEditor<T> {
        setDuration(start: number, end?: number): T;
    }

    class ActionEditor extends BaseActionEditor<ActionEditor>{}
    class EndableActionEditor extends BaseEndableActionEditor<EndableActionEditor>{}
    class TimelineActionEditor extends BaseTimelineActionEditor<TimelineActionEditor>{}

    enum TimelineType {
        animation = 'animation',
        video = 'video'
    }

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
        broadcast(eventName: string, args?: any[]): void;
        broadcastForTopic(eventName: string, eventTopic: string, args?: any[]): void;
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

    interface IOperationData {
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
