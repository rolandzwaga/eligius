import Eventbus from './eventbus/eventbus';
import ActionRegistryEventbusListener from './eventbus/actionregistryeventbuslistener';
import RequestVideoUrlInterceptor from './eventbus/requestvideouriInterceptor';
import TimelineAction from "./action/timelineaction";
import EndableAction from "./action/endableaction";
import Action from "./action/action";
import $ from 'jquery';
import getNestedValue from './operation/helper/getNestedValue';

class EngineFactory {
    
    constructor(importer) {
        this.init(importer);
    }

    init(importer) {
        this.resizeTimeout = -1;
        this.actionsLookup = {};

        this.importer = importer;

        this.eventBus = new Eventbus();
        this.eventBus.on("request-instance", this.requestInstanceHandler.bind(this));
        this.eventBus.on("request-action", this.requestActionHandler.bind(this));
        this.eventBus.on("request-function", this.requestFunctionHandler.bind(this));
        
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
            this.eventBus.broadcast('resize');
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

    createEngine(config, engineCtor) {
        this.actionsLookup = {};
        let actionReg = null;
        if ((config.eventActions) && (config.eventActions.length)) {
            actionReg = new ActionRegistryEventbusListener();
            this.eventBus.registerEventlistener(actionReg);
        }

        this.eventBus.registerInterceptor("request-video-url", new RequestVideoUrlInterceptor(this.eventBus));


        const facadeCtor = this.importSystemEntry(config.playerSettings.systemName);

        this.processConfiguration(config, config);

        const player = new facadeCtor(this.eventBus, config);

        this.resolveOperations(config);

        this.initializeTimelineActions(config);

        this.initializeInitActions(config);

        this.initializeActions(config);

        this.initializeEventActions(actionReg, config);

        const engine = new engineCtor(config, this.eventBus, player);
        return engine;

    }

    initializeEventActions(actionReg, config) {
        if ((actionReg) && (config.eventActions)) {
            config.eventActions.forEach((actionData) => {
                const eventAction = new Action(actionData, this.eventBus);
                actionReg.registerAction(eventAction, actionData.eventName, actionData.eventTopic);
            });
            config.eventActions = null;
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
        if (config.videourls) {
            config.videourls.forEach(this.initializeTimelineAction.bind(this));
        }
    }

    initializeTimelineAction(videoUrl) {
        videoUrl.timelineActions = videoUrl.timelineActions.map((actionData) => {
            const timelineAction = new TimelineAction(actionData, this.eventBus);
            if (!timelineAction.endOperations) {
                timelineAction.endOperations = [];
            }
            return timelineAction;
        });
    }

    resolveOperations(config) {
        const timelineOperations = [];
        config.videourls.forEach((urlInfo) => {
            timelineOperations.push(...this.gatherOperationSystemNames(urlInfo.timelineActions));
        });

        const systemNameHolders = (this.gatherOperationSystemNames(config.initActions))
                                    .concat(timelineOperations)
                                    .concat(this.gatherOperationSystemNames(config.actions))
                                    .concat(this.gatherOperationSystemNames(config.eventActions));

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
            for (let p in config) {
                if (config.hasOwnProperty(p)) {
                    const value = config[p];
                    if (typeof value === "string") {
                        if ((value.substr(0, 7) === "config:")) {
                            const configProperty = value.substr(7, value.length);
                            config[p] = this._getNestedPropertyValue(configProperty, parentConfig);
                        }
                        else if ((value.substr(0, 9) === "template:")) {
                            config[p] = this.importSystemEntry(value);
                        }
                        else if ((value.substr(0, 5) === "json:")) {
                            config[p] = JSON.parse(this.importSystemEntry(value));
                        }
                        else if ((value.substr(0, 4) === "css:")) {
                            console.error(`We need to load this css: ${value}`);
                        }
                    } else if (typeof value === "object") {
                        this.processConfiguration(config[p], parentConfig);
                    }
                }
            }
        }
    }

    gatherOperationSystemNames(actions) {
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
