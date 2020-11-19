import { isDefined } from 'ts-is-present';
import { Action, EndableAction, TimelineAction } from '~/action';
import { IAction } from '~/action/types';
import { ActionRegistryEventbusListener } from '~/eventbus';
import { IEventbus } from '~/eventbus/types';
import { deepcopy } from '~/operation/helper/deepcopy';
import { getNestedPropertyValue } from '~/operation/helper/get-nested-property-value';
import { IConfigurationResolver, IResourceImporter } from '~/types';
import {
  IActionConfiguration,
  IEndableActionConfiguration,
  IEngineConfiguration,
  IEventActionConfiguration,
  IOperationConfiguration,
  IResolvedEngineConfiguration,
  IResolvedOperation,
  IResolvedTimelineConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from './types';

export class ConfigurationResolver implements IConfigurationResolver {
  constructor(private importer: IResourceImporter, private eventbus: IEventbus) {}

  process(
    configuration: IEngineConfiguration,
    actionRegistryListener?: ActionRegistryEventbusListener
  ): [Record<string, IAction>, IResolvedEngineConfiguration] {
    resolvePlaceholders(configuration, configuration, this.importer);

    const resolvedConfig: IResolvedEngineConfiguration = {
      id: configuration.id,
      engine: { ...configuration.engine },
      timelineProviderSettings: deepcopy(configuration.timelineProviderSettings),
      containerSelector: configuration.containerSelector,
      language: configuration.language,
      layoutTemplate: configuration.layoutTemplate,
      availableLanguages: deepcopy(configuration.availableLanguages),
      actions: resolveActions(configuration.actions, this.importer, this.eventbus),
      initActions: resolveActions(configuration.initActions, this.importer, this.eventbus),
      labels: deepcopy(configuration.labels),
      timelineFlow: deepcopy(configuration.timelineFlow),
      timelines: resolveTimelines(configuration.timelines, this.importer, this.eventbus),
    };

    let eventActions: IAction[] = [];
    if (configuration.eventActions && actionRegistryListener) {
      eventActions = resolveEventActions(
        configuration.eventActions,
        actionRegistryListener,
        this.importer,
        this.eventbus
      );
    }

    const actionsLookup = resolvedConfig.actions.concat(eventActions as any[]).reduce<Record<string, IAction>>(
      (aggr, action) => ({
        ...aggr,
        [action.name]: action,
      }),
      {}
    );

    return [actionsLookup, resolvedConfig];
  }
}

function resolveEventActions(
  eventActionConfigurations: IEventActionConfiguration[],
  actionRegistryListener: ActionRegistryEventbusListener,
  importer: IResourceImporter,
  eventbus: IEventbus
) {
  const resolvedConfigs = eventActionConfigurations.map<IResolvedActionConfiguration>((config) => {
    return resolveActionConfiguration(config, importer);
  });

  return resolvedConfigs.map((config, index) => {
    const { eventName, eventTopic } = eventActionConfigurations[index];
    const eventAction = new Action(config.name, config.startOperations, eventbus);
    actionRegistryListener.registerAction(eventAction, eventName, eventTopic);
    return eventAction;
  });
}

function resolveTimelines(timelines: ITimelineConfiguration[], importer: IResourceImporter, eventbus: IEventbus) {
  const resolve = resolveTimelineAction.bind(null, importer, eventbus);

  return timelines.map<IResolvedTimelineConfiguration>((config) => ({
    ...config,
    timelineActions: config.timelineActions.map(resolve),
  }));
}

function resolveOperation(importer: IResourceImporter, operationConfig: IOperationConfiguration): IResolvedOperation {
  return {
    id: operationConfig.id,
    systemName: operationConfig.systemName,
    operationData: deepcopy(operationConfig.operationData),
    instance: importer.import(operationConfig.systemName)[operationConfig.systemName],
  };
}

function resolveActionConfiguration(
  config: IActionConfiguration,
  importer: IResourceImporter
): IResolvedActionConfiguration {
  const resolve = resolveOperation.bind(null, importer);

  return {
    id: config.id,
    name: config.name,
    startOperations: config.startOperations.map(resolve),
  };
}

function resolveEndableActionConfiguration(
  config: IEndableActionConfiguration,
  importer: IResourceImporter
): IResolvedEndableActionConfiguration {
  const resolve = resolveOperation.bind(null, importer);

  const action = resolveActionConfiguration(config, importer);

  return {
    ...action,
    endOperations: config.endOperations.map(resolve),
  };
}

function resolveTimelineAction(
  importer: IResourceImporter,
  eventbus: IEventbus,
  actionConfiguration: ITimelineActionConfiguration
) {
  const resolvedConfig = resolveEndableActionConfiguration(actionConfiguration, importer);
  const duration = {
    end: actionConfiguration.duration.end ?? -1,
    start: actionConfiguration.duration.start,
  };

  const { id, name, endOperations, startOperations } = resolvedConfig;
  const action = new TimelineAction(name, startOperations, endOperations, duration, eventbus);
  action.id = id;
  return action;
}

function resolveActions(
  actionConfigurations: IEndableActionConfiguration[],
  importer: IResourceImporter,
  eventbus: IEventbus
) {
  const resolvedConfigs = actionConfigurations.map<IResolvedEndableActionConfiguration>((config) => {
    return resolveEndableActionConfiguration(config, importer);
  });

  return resolvedConfigs.map<EndableAction>((resolvedConfig) => {
    const { name, endOperations, startOperations } = resolvedConfig;
    const action = new EndableAction(name, startOperations, endOperations, eventbus);
    action.id = resolvedConfig.id;
    return action;
  });
}

function resolvePlaceholders(config: any, rootConfig: any, importer: IResourceImporter) {
  if (!isDefined(config)) {
    return;
  }

  if (Array.isArray(config)) {
    config.forEach((item) => {
      resolvePlaceholders(item, rootConfig, importer);
    });
  } else {
    Object.keys(config).forEach((key) => {
      resolvePlaceholder(key, config, rootConfig, importer);
    });
  }
}

function resolvePlaceholder(key: string, config: any, rootConfig: any, importer: IResourceImporter) {
  const value = config[key];
  if (typeof value === 'string') {
    if (value.startsWith('config:')) {
      const configProperty = value.substr(7, value.length);
      config[key] = getNestedPropertyValue(configProperty, rootConfig);
    } else if (value.startsWith('template:')) {
      const templateKey = value.substr(9, value.length);
      config[key] = importer.import(templateKey)[templateKey];
    } else if (value.startsWith('json:')) {
      const jsonKey = value.substr(5, value.length);
      const json = importer.import(jsonKey)[jsonKey];
      config[key] = json;
    }
  } else if (typeof value === 'object') {
    resolvePlaceholders(config[key], rootConfig, importer);
  }
}

interface IResolvedActionConfiguration {
  id: string;
  name: string;
  startOperations: IResolvedOperation[];
}

interface IResolvedEndableActionConfiguration extends IResolvedActionConfiguration {
  endOperations: IResolvedOperation[];
}

interface IResolvedEventActionConfiguration extends IResolvedActionConfiguration {
  eventName: string;
  eventTopic?: string;
}
