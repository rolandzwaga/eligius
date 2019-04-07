import { Eventbus, ActionRegistryEventbusListener, RequestVideoUriInterceptor } from './eventbus';
import { TimelineAction, EndableAction, Action } from './action';
import $ from 'jquery';
import getNestedValue from './operation/helper/getNestedValue';
import TimelineEventNames from './timeline-event-names';

class EngineFactory {
    
    constructor(importer, eventbus) {
        this.init(importer, eventbus);
    }

    init(importer, eventbus) {
        this.resizeTimeout = -1;
        this.actionsLookup = {};

        this.importer = importer;

        this.eventBus = eventbus || new Eventbus();
        this.eventBus.on(TimelineEventNames.REQUEST_INSTANCE, this.requestInstanceHandler.bind(this));
        this.eventBus.on(TimelineEventNames.REQUEST_ACTION, this.requestActionHandler.bind(this));
        this.eventBus.on(TimelineEventNames.REQUEST_FUNCTION, this.requestFunctionHandler.bind(this));
        
        $(window).resize(this.resizeHandler.bind(this));
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
            console.error(`Unknown action name: ${systemName}`);
            resultCallback(null);
        }
    }

    createEngine(configuration, engineClass) {
        this.actionsLookup = {};
        let actionRegistryListener = null;
        if ((configuration.eventActions) && (configuration.eventActions.length)) {
            actionRegistryListener = new ActionRegistryEventbusListener();
            this.eventBus.registerEventlistener(actionRegistryListener);
        }

        this.eventBus.registerInterceptor(TimelineEventNames.REQUEST_TIMELINE_URI, new RequestVideoUriInterceptor(this.eventBus));

        this.processConfiguration(configuration, configuration);

        const providerClass = this.importSystemEntry(configuration.timelineProviderSettings.systemName);

        const timelineProvider = new providerClass(this.eventBus, configuration);

        this.resolveOperations(configuration);

        this.initializeTimelineActions(configuration);

        this.initializeInitActions(configuration);

        this.initializeActions(configuration);

        this.initializeEventActions(actionRegistryListener, configuration);

        const chronoTriggerEngine = new engineClass(configuration, this.eventBus, timelineProvider);
        return chronoTriggerEngine;
    }

    initializeEventActions(actionRegistryListener, config) {
        if ((actionRegistryListener) && (config.eventActions)) {
            config.eventActions.forEach((actionData) => {
                const eventAction = new Action(actionData, this.eventBus);
                actionRegistryListener.registerAction(eventAction, actionData.eventName, actionData.eventTopic);
            });
            delete config.eventActions;
        }
    }

    initializeActions(config) {
        if (config.actions) {
            config.actions.forEach((actionData) => {
                const action = new EndableAction(actionData, this.eventBus);
                this.actionsLookup[actionData.name] = action;
            });
        }
    }

    initializeInitActions(config) {
        if (config.initActions) {
            config.initActions = config.initActions.map((actionData) => {
                const initAction = new EndableAction(actionData, this.eventBus);
                this.actionsLookup[actionData.name] = initAction;
                return initAction;
            });
        }
    }

    initializeTimelineActions(config) {
        if (config.timelines) {
            config.timelines.forEach(this.initializeTimelineAction.bind(this));
        }
    }

    initializeTimelineAction(timelineConfig) {
        timelineConfig.timelineActions = timelineConfig.timelineActions.map((actionData) => {
            const timelineAction = new TimelineAction(actionData, this.eventBus);
            if (!timelineAction.endOperations) {
                timelineAction.endOperations = [];
            }
            return timelineAction;
        });
    }

    resolveOperations(config) {
        const timelineOperations = [];
        config.timelines.forEach((timelineInfo) => {
            timelineOperations.push(...this.gatherOperations(timelineInfo.timelineActions));
        });

        const systemNameHolders = this.gatherOperations(config.initActions)
                                    .concat(timelineOperations)
                                    .concat(this.gatherOperations(config.actions))
                                    .concat(this.gatherOperations(config.eventActions));

        systemNameHolders.forEach((holder)=> {
            holder.instance = this.importSystemEntry(holder.systemName);
        });
    }

    _getNestedPropertyValue(propertyChain, sourceObject) {
        const properties = propertyChain.split('.');
        return getNestedValue(properties, sourceObject);
    }

    processConfiguration(config, parentConfig) {
        if (config == null) {
            return;
        }
        if (config.constructor === Array) {
            for (let i = 0, ii = config.length; i < ii; i++) {
                this.processConfiguration(config[i], parentConfig);
            }
        } else {
            Object.keys(config).forEach((key) => {
                this.processConfigProperty(key, config);
            });
        }
    }

    processConfigProperty(key, config) {
        const value = config[key];
        if (typeof value === 'string') {
            if ((value.substr(0, 7) === 'config:')) {
                const configProperty = value.substr(7, value.length);
                config[p] = this._getNestedPropertyValue(configProperty, parentConfig);
            }
            else if ((value.substr(0, 9) === 'template:')) {
                config[p] = this.importSystemEntry(value);
            }
            else if ((value.substr(0, 5) === 'json:')) {
                config[p] = JSON.parse(this.importSystemEntry(value));
            }
            else if ((value.substr(0, 4) === 'css:')) {
                console.error(`We need to load this css: ${value}`);
            }
        } else if (typeof value === 'object') {
            this.processConfiguration(config[p], parentConfig);
        }
    }

    gatherOperations(actions) {
        if (!actions) {
            return [];
        }
        let result = [];
        actions.forEach((action) => {
            if (action.endOperations) {
                result = result.concat(action.startOperations.concat(action.endOperations));
            } else {
                result = result.concat(action.startOperations);
            }
        });
        return result;
    }
}

export default EngineFactory;
