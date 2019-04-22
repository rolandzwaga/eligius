import { Eventbus, ActionRegistryEventbusListener, RequestVideoUriInterceptor } from './eventbus';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';
import ConfigurationResolver from './configuration/configuration-resolver';

class EngineFactory {
    
    constructor(importer, windowRef, eventbus) {
        this._init(importer, windowRef, eventbus);
    }

    _init(importer, windowRef, eventbus) {
        this.resizeTimeout = -1;
        this.actionsLookup = null;

        this.importer = importer;

        this.eventBus = eventbus || new Eventbus();
        this.eventBus.on(TimelineEventNames.REQUEST_INSTANCE, this._requestInstanceHandler.bind(this));
        this.eventBus.on(TimelineEventNames.REQUEST_ACTION, this._requestActionHandler.bind(this));
        this.eventBus.on(TimelineEventNames.REQUEST_FUNCTION, this._requestFunctionHandler.bind(this));
        
        $(windowRef).resize(this._resizeHandler.bind(this));
    }

    destroy() {
        this.eventBus.clear();
        this.eventBus = null;
    }

    _resizeHandler() {
        if (this.resizeTimeout > -1) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.eventBus.broadcast(TimelineEventNames.RESIZE);
        }, 200);
    }

    _importSystemEntryWithEventbusDependency(systemName) {
        const ctor = this._importSystemEntry(systemName);
        return new ctor(this.eventBus);
    }

    _importSystemEntry(systemName) {
        return this.importer.import(systemName)[systemName];
    }

    _requestInstanceHandler(systemName, resultCallback) {
        resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
    }

    _requestFunctionHandler(systemName, resultCallback) {
        resultCallback(this._importSystemEntry(systemName));
    }

    _requestActionHandler(systemName, resultCallback) {
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
        const engineClass = this._importSystemEntry(systemName);

        let actionRegistryListener = null;
        if ((configuration.eventActions) && (configuration.eventActions.length)) {
            actionRegistryListener = new ActionRegistryEventbusListener();
            this.eventBus.registerEventlistener(actionRegistryListener);
        }

        this.eventBus.registerInterceptor(TimelineEventNames.REQUEST_TIMELINE_URI, new RequestVideoUriInterceptor(this.eventBus));

        const resolver = new ConfigurationResolver(this.importer, this.eventBus);
        this.actionsLookup = resolver.process(actionRegistryListener, configuration)

        const timelineProviderClass = this._importSystemEntry(configuration.timelineProviderSettings.systemName);
        const timelineProvider = new timelineProviderClass(this.eventBus, configuration);

        const chronoTriggerEngine = new engineClass(configuration, this.eventBus, timelineProvider);
        return chronoTriggerEngine;
    }

}

export default EngineFactory;
