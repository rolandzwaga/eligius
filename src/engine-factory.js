import {
    Eventbus,
    ActionRegistryEventbusListener,
    RequestVideoUriInterceptor
} from './eventbus';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';
import ConfigurationResolver from './configuration/configuration-resolver';
import Mousetrap from 'mousetrap';
import LanguageManager from './language-manager';

class EngineFactory {

    constructor(importer, windowRef, eventbus) {
        this._init(importer, windowRef, eventbus);
    }

    _init(importer, windowRef, eventbus) {
        this._resizeTimeout = -1;
        this._actionsLookup = null;

        this._importer = importer;

        this._eventbus = eventbus || new Eventbus();
        this._eventbus.on(TimelineEventNames.REQUEST_INSTANCE, this._requestInstanceHandler.bind(this));
        this._eventbus.on(TimelineEventNames.REQUEST_ACTION, this._requestActionHandler.bind(this));
        this._eventbus.on(TimelineEventNames.REQUEST_FUNCTION, this._requestFunctionHandler.bind(this));

        $(windowRef).resize(this._resizeHandler.bind(this));
    }

    destroy() {
        this._eventbus.clear();
        this._eventbus = null;
    }

    _resizeHandler() {
        if (this._resizeTimeout > -1) {
            clearTimeout(this._resizeTimeout);
        }
        this._resizeTimeout = setTimeout(() => {
            this._eventbus.broadcast(TimelineEventNames.RESIZE);
        }, 200);
    }

    _importSystemEntryWithEventbusDependency(systemName) {
        const ctor = this._importSystemEntry(systemName);
        return new ctor(this._eventbus);
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
        const { systemName } = configuration.engine;
        const engineClass = this._importSystemEntry(systemName);

        let actionRegistryListener = null;
        if ((configuration.eventActions) && (configuration.eventActions.length)) {
            actionRegistryListener = new ActionRegistryEventbusListener();
            this._eventbus.registerEventlistener(actionRegistryListener);
        }

        this._eventbus.registerInterceptor(TimelineEventNames.REQUEST_TIMELINE_URI, new RequestVideoUriInterceptor(this._eventbus));

        resolver = resolver || new ConfigurationResolver(this._importer, this._eventbus);
        this._actionsLookup = resolver.process(actionRegistryListener, configuration);

        const timelineProviderClass = this._importSystemEntry(configuration.timelineProviderSettings.systemName);
        const timelineProvider = new timelineProviderClass(this._eventbus, configuration);

        Mousetrap.bind('space', event => {
            event.preventDefault();
            this._eventbus.broadcastForTopic(TimelineEventNames.PLAY_TOGGLE_REQUEST, timelineProvider.providerid);
            return false;
        });

        const { language, labels } = configuration;
        const languageManager = new LanguageManager(language, labels, this._eventbus);

        const chronoTriggerEngine = new engineClass(configuration, this._eventbus, timelineProvider, languageManager);
        return chronoTriggerEngine;
    }

}

export default EngineFactory;