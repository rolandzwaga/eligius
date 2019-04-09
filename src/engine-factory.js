import { Eventbus, ActionRegistryEventbusListener, RequestVideoUriInterceptor } from './eventbus';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';
import ConfigurationResolver from './configuration/configuration-resolver';

class EngineFactory {
    
    constructor(importer, windowRef, eventbus) {
        this.init(importer, windowRef, eventbus);
    }

    init(importer, windowRef, eventbus) {
        this.resizeTimeout = -1;
        this.actionsLookup = null;

        this.importer = importer;

        this.eventBus = eventbus || new Eventbus();
        this.eventBus.on(TimelineEventNames.REQUEST_INSTANCE, this.requestInstanceHandler.bind(this));
        this.eventBus.on(TimelineEventNames.REQUEST_ACTION, this.requestActionHandler.bind(this));
        this.eventBus.on(TimelineEventNames.REQUEST_FUNCTION, this.requestFunctionHandler.bind(this));
        
        $(windowRef).resize(this.resizeHandler.bind(this));
    }

    destroy() {
        this.eventBus.clear();
        this.eventBus = null;
    }

    resizeHandler() {
        if (this.resizeTimeout > -1) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.eventBus.broadcast(TimelineEventNames.RESIZE);
        }, 200);
    }

    importSystemEntryWithEventbusDependency(systemName) {
        const ctor = this.importSystemEntry(systemName);
        return new ctor(this.eventBus);
    }

    importSystemEntry(systemName) {
        return this.importer.import(systemName)[systemName];
    }

    requestInstanceHandler(systemName, resultCallback) {
        resultCallback(this.importSystemEntryWithEventbusDependency(systemName));
    }

    requestFunctionHandler(systemName, resultCallback) {
        resultCallback(this.importSystemEntry(systemName));
    }

    requestActionHandler(systemName, resultCallback) {
        const action = this.actionsLookup[systemName];
        if (action) {
            resultCallback(action);
        } else {
            console.error(`Unknown action: ${systemName}`);
            resultCallback(null);
        }
    }

    createEngine(configuration) {
        const { systemName } = configuration.engine;
        const engineClass = this.importSystemEntry(systemName);

        let actionRegistryListener = null;
        if ((configuration.eventActions) && (configuration.eventActions.length)) {
            actionRegistryListener = new ActionRegistryEventbusListener();
            this.eventBus.registerEventlistener(actionRegistryListener);
        }

        this.eventBus.registerInterceptor(TimelineEventNames.REQUEST_TIMELINE_URI, new RequestVideoUriInterceptor(this.eventBus));

        const resolver = new ConfigurationResolver(this.importer);
        this.actionsLookup = resolver.process(actionRegistryListener, configuration)

        const timelineProviderClass = this.importSystemEntry(configuration.timelineProviderSettings.systemName);
        const timelineProvider = new timelineProviderClass(this.eventBus, configuration);

        const chronoTriggerEngine = new engineClass(configuration, this.eventBus, timelineProvider);
        return chronoTriggerEngine;
    }

}

export default EngineFactory;
