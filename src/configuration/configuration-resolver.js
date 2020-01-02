import { TimelineAction, EndableAction, Action } from '../action';
import getNestedPropertyValue from '../operation/helper/getNestedPropertyValue';

class ConfigurationResolver {

    constructor(importer, eventbus) {
        this.importer = importer;
        this.eventbus = eventbus;
    }

    importSystemEntry(systemName) {
        return this.importer.import(systemName)[systemName];
    }

    process(actionRegistryListener, configuration) {
        const actionsLookup = {};
        this.processConfiguration(configuration, configuration);
        this.resolveOperations(configuration);
        this.initializeTimelineActions(configuration);
        this.initializeInitActions(configuration, actionsLookup);
        this.initializeActions(configuration, actionsLookup);
        this.initializeEventActions(actionRegistryListener, configuration);
        return actionsLookup;
    }

    initializeEventActions(actionRegistryListener, config) {
        if ((actionRegistryListener) && (config.eventActions)) {
            config.eventActions.forEach((actionData) => {
                const eventAction = new Action(actionData, this.eventbus);
                actionRegistryListener.registerAction(eventAction, actionData.eventName, actionData.eventTopic);
            });
            delete config.eventActions;
        }
    }

    initializeActions(config, actionsLookup) {
        if (config.actions) {
            config.actions.forEach((actionData) => {
                const action = new EndableAction(actionData, this.eventbus);
                actionsLookup[actionData.name] = action;
            });
            delete config.actions;
        }
    }

    initializeInitActions(config, actionsLookup) {
        if (!config.initActions) {
            return;
        }
        config.initActions = config.initActions.map((actionData) => {
            const initAction = new EndableAction(actionData, this.eventbus);
            actionsLookup[actionData.name] = initAction;
            return initAction;
        });
    }

    initializeTimelineActions(config) {
        if (config.timelines) {
            config.timelines.forEach(this.initializeTimelineAction.bind(this));
        }
    }

    initializeTimelineAction(timelineConfig) {
        if (!timelineConfig.timelineActions) {
            return;
        }
        timelineConfig.timelineActions = timelineConfig.timelineActions.map((actionData) => {
            const timelineAction = new TimelineAction(actionData, this.eventbus);
            if (!timelineAction.endOperations) {
                timelineAction.endOperations = [];
            }
            return timelineAction;
        });
    }

    resolveOperations(config) {
        const timelineOperations = [];
        if (config.timelines) {
            config.timelines.forEach((timelineInfo) => {
                timelineOperations.push(...this._gatherOperations(timelineInfo.timelineActions));
            });
        }

        const systemNameHolders = this._gatherOperations(config.initActions)
                                    .concat(timelineOperations)
                                    .concat(this._gatherOperations(config.actions))
                                    .concat(this._gatherOperations(config.eventActions));

        systemNameHolders.forEach((holder)=> {
            holder.instance = this.importSystemEntry(holder.systemName);
        });
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
                this.processConfigProperty(key, config, parentConfig);
            });
        }
    }

    processConfigProperty(key, config, parentConfig) {
        const value = config[key];
        if (typeof value === 'string') {           
            if ((value.startsWith('config:'))) {
                const configProperty = value.substr(7, value.length);
                config[key] = getNestedPropertyValue(configProperty, parentConfig);
            }
            else if ((value.startsWith('template:'))) {
                const templateKey = value.substr(9, value.length);
                config[key] = this.importSystemEntry(templateKey);
            }
            else if ((value.startsWith('json:'))) {
                const jsonKey = value.substr(5, value.length);
                const json = this.importSystemEntry(jsonKey);
                config[key] = json;
            }
        } else if (typeof value === 'object') {
            this.processConfiguration(config[key], parentConfig);
        }
    }

    _gatherOperations(actions) {
        return (actions || []).reduce((list, action) => {
            if (action.endOperations) {
                return list.concat(action.startOperations.concat(action.endOperations));
            } else {
                return list.concat(action.startOperations);
            }
        }, []);
    }
}

export default ConfigurationResolver;
