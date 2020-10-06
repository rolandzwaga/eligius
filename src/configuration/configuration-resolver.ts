import { TimelineAction, EndableAction, Action } from '../action';
import getNestedPropertyValue from '../operation/helper/getNestedPropertyValue';
import {
  IConfigurationResolver,
  IResourceImporter,
  IEngineConfiguration,
  IEngineFactory,
  ITimelineConfiguration,
  IResolvedEngineConfiguration,
} from '../types';
import { IEventbus, IEventListener } from '../eventbus/types';
import {
  IAction,
  IResolvedActionConfiguration,
  IResolvedEndableActionConfiguration,
  IResolvedEventActionConfiguration,
} from '../action/types';
import { ActionRegistryEventbusListener } from '../eventbus';

class ConfigurationResolver implements IConfigurationResolver {
  constructor(private importer: IResourceImporter, private eventbus: IEventbus) {}

  importSystemEntry(systemName: string): any {
    return this.importer.import(systemName)[systemName];
  }

  process(
    actionRegistryListener: ActionRegistryEventbusListener | undefined,
    configuration: IEngineConfiguration
  ): [Record<string, IAction>, IResolvedEngineConfiguration] {
    const actionsLookup: Record<string, IAction> = {};
    this.processConfiguration(configuration, configuration);
    this.resolveOperations(configuration);
    this.initializeEventActions(actionRegistryListener, configuration);
    this.initializeTimelineActions(configuration);
    this.initializeInitActions(configuration, actionsLookup);
    this.initializeActions(configuration, actionsLookup);
    return [actionsLookup, (configuration as unknown) as IResolvedEngineConfiguration];
  }

  initializeEventActions(
    actionRegistryListener: ActionRegistryEventbusListener | undefined,
    config: IEngineConfiguration
  ): void {
    if (actionRegistryListener && config.eventActions) {
      ((config.eventActions as unknown) as IResolvedEventActionConfiguration[]).forEach((actionData) => {
        const eventAction = new Action(actionData, this.eventbus);
        actionRegistryListener.registerAction(eventAction, actionData.eventName, actionData.eventTopic);
      });
      delete config.eventActions;
    }
  }

  initializeActions(config: IEngineConfiguration, actionsLookup: Record<string, IAction>) {
    if (config.actions) {
      ((config.actions as unknown) as IResolvedEndableActionConfiguration[]).forEach((actionData) => {
        const action = new EndableAction(actionData, this.eventbus);
        actionsLookup[actionData.name] = action;
      });
      delete (config as any).actions;
    }
  }

  initializeInitActions(config: IEngineConfiguration, actionsLookup: Record<string, IAction>) {
    if (!config.initActions) {
      return;
    }

    (config as any).initActions = ((config.initActions as unknown) as IResolvedEndableActionConfiguration[]).map(
      (actionData) => {
        const initAction = new EndableAction(actionData, this.eventbus);
        actionsLookup[actionData.name] = initAction;
        return initAction;
      }
    );
  }

  initializeTimelineActions(config: IEngineConfiguration) {
    if (config.timelines) {
      config.timelines.forEach(this.initializeTimelineAction.bind(this));
    }
  }

  initializeTimelineAction(timelineConfig: ITimelineConfiguration) {
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

  resolveOperations(config: IEngineConfiguration) {
    const timelineOperations: any[] = [];
    if (config.timelines) {
      config.timelines.forEach((timelineInfo) => {
        timelineOperations.push(...this._gatherOperations(timelineInfo.timelineActions));
      });
    }

    const systemNameHolders = this._gatherOperations(config.initActions)
      .concat(timelineOperations)
      .concat(this._gatherOperations(config.actions))
      .concat(this._gatherOperations(config.eventActions ?? []));

    systemNameHolders.forEach((holder) => {
      holder.instance = this.importSystemEntry(holder.systemName);
    });
  }

  processConfiguration(config: any, parentConfig: any) {
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

  processConfigProperty(key: string, config: any, parentConfig: any) {
    const value = config[key];
    if (typeof value === 'string') {
      if (value.startsWith('config:')) {
        const configProperty = value.substr(7, value.length);
        config[key] = getNestedPropertyValue(configProperty, parentConfig);
      } else if (value.startsWith('template:')) {
        const templateKey = value.substr(9, value.length);
        config[key] = this.importSystemEntry(templateKey);
      } else if (value.startsWith('json:')) {
        const jsonKey = value.substr(5, value.length);
        const json = this.importSystemEntry(jsonKey);
        config[key] = json;
      }
    } else if (typeof value === 'object') {
      this.processConfiguration(config[key], parentConfig);
    }
  }

  _gatherOperations(actions: any[]): any[] {
    if (!actions) {
      return [];
    }
    return actions.reduce((list, action) => {
      if (action.endOperations) {
        return list.concat(action.startOperations.concat(action.endOperations));
      } else {
        return list.concat(action.startOperations);
      }
    }, []);
  }
}

export default ConfigurationResolver;
