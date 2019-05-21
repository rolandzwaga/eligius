import {
    Eventbus,
    ActionRegistryEventbusListener,
    RequestVideoUriInterceptor
} from './eventbus';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';
import ConfigurationResolver from './configuration/configuration-resolver';
import Mousetrap from 'mousetrap';

class EngineFactory {

    constructor(importer, windowRef, eventbus) {
        this._init(importer, windowRef, eventbus);
    }

    _init(importer, windowRef, eventbus) {
        this._resizeTimeout = -1;
        this._actionsLookup = null;

        this._importer = importer;

        this._eventBus = eventbus || new Eventbus();
        this._eventBus.on(TimelineEventNames.REQUEST_INSTANCE, this._requestInstanceHandler.bind(this));
        this._eventBus.on(TimelineEventNames.REQUEST_ACTION, this._requestActionHandler.bind(this));
        this._eventBus.on(TimelineEventNames.REQUEST_FUNCTION, this._requestFunctionHandler.bind(this));

        $(windowRef).resize(this._resizeHandler.bind(this));
    }

    destroy() {
        this._eventBus.clear();
        this._eventBus = null;
    }

    _resizeHandler() {
        if (this._resizeTimeout > -1) {
            clearTimeout(this._resizeTimeout);
        }
        this._resizeTimeout = setTimeout(() => {
            this._eventBus.broadcast(TimelineEventNames.RESIZE);
        }, 200);
    }

    _importSystemEntryWithEventbusDependency(systemName) {
        const ctor = this._importSystemEntry(systemName);
        return new ctor(this._eventBus);
    }

    _importSystemEntry(systemName) {
        return this._importer.import(systemName)[systemName];
    }

    _requestInstanceHandler(systemName, resultCallback) {
        resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
    }

    _requestFunctionHandler(systemName, resultCallback) {
        resultCallback(this._importSystemEntry(systemName));
    }

    _requestActionHandler(systemName, resultCallback) {
        const action = this._actionsLookup[systemName];
        if (action) {
            resultCallback(action);
        } else {
            console.error(`Unknown action: ${systemName}`);
            resultCallback(null);
        }
    }

    createEngine(configuration, resolver) {
        const {
            systemName
        } = configuration.engine;
        const engineClass = this._importSystemEntry(systemName);

        let actionRegistryListener = null;
        if ((configuration.eventActions) && (configuration.eventActions.length)) {
            actionRegistryListener = new ActionRegistryEventbusListener();
            this._eventBus.registerEventlistener(actionRegistryListener);
        }

        this._eventBus.registerInterceptor(TimelineEventNames.REQUEST_TIMELINE_URI, new RequestVideoUriInterceptor(this._eventBus));

        resolver = resolver || new ConfigurationResolver(this._importer, this._eventBus);
        this._actionsLookup = resolver.process(actionRegistryListener, configuration);

        const timelineProviderClass = this._importSystemEntry(configuration.timelineProviderSettings.systemName);
        const timelineProvider = new timelineProviderClass(this._eventBus, configuration);

        Mousetrap.bind('space', event => {
            event.preventDefault();
            this._eventbus.broadcastForTopic(TimelineEventNames.PLAY_TOGGLE_REQUEST, timelineProvider.providerid);
            return false;
        });

        const chronoTriggerEngine = new engineClass(configuration, this._eventBus, timelineProvider);
        return chronoTriggerEngine;
    }

}

export default EngineFactory;