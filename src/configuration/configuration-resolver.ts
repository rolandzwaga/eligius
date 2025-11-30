import {Action, EndableAction, TimelineAction} from '@action/index.ts';
import type {IAction} from '@action/types.ts';
import type {
  IActionConfiguration,
  IEndableActionConfiguration,
  IEngineConfiguration,
  IEventActionConfiguration,
  IOperationConfiguration,
  IResolvedActionConfiguration,
  IResolvedEndableActionConfiguration,
  IResolvedEngineConfiguration,
  IResolvedOperation,
  IResolvedTimelineConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from '@configuration/types.ts';
import type {ActionRegistryEventbusListener} from '@eventbus/index.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {resolvePropertyChain} from '@operation/helper/resolve-property-chain.ts';
import type {TOperationData} from '@operation/types.ts';
import {isObject} from '@util/guards/is-object.ts';
import {isString} from '@util/guards/is-string.ts';
import {isDefined} from 'ts-is-present';
import type {
  IConfigurationResolver,
  ISimpleResourceImporter,
} from '../types.ts';

/**
 * Takes an `IEngineConfiguration` instance and return an `IResolvedEngineConfiguration`.
 * This means all system names within the configuration will be resolved to their associated instances.
 *
 * If the given configuration includes event actions, then those will be registered in the given `ActionRegistryEventbusListener`.
 *
 */
export class ConfigurationResolver implements IConfigurationResolver {
  constructor(
    private importer: ISimpleResourceImporter,
    private eventbus: IEventbus
  ) {}

  process(
    configuration: IEngineConfiguration,
    actionRegistryListener?: ActionRegistryEventbusListener
  ): [Record<string, IAction>, IResolvedEngineConfiguration] {
    resolvePlaceholders(configuration, configuration, this.importer);

    if (!isDefined(configuration.timelineProviderSettings)) {
      throw new Error(
        'Configuration incomplete: it needs to have at least one timeline provider setting'
      );
    }

    const resolvedConfig: IResolvedEngineConfiguration = {
      id: configuration.id,
      engine: {...configuration.engine},
      timelineProviderSettings: deepCopy(
        configuration.timelineProviderSettings
      ),
      containerSelector: configuration.containerSelector,
      cssFiles: configuration.cssFiles,
      language: configuration.language,
      layoutTemplate: configuration.layoutTemplate,
      availableLanguages: deepCopy(configuration.availableLanguages),
      actions: resolveActions(
        configuration.actions,
        this.importer,
        this.eventbus
      ),
      initActions: resolveActions(
        configuration.initActions,
        this.importer,
        this.eventbus
      ),
      labels: deepCopy(configuration.labels),
      timelineFlow: deepCopy(configuration.timelineFlow),
      timelines: resolveTimelines(
        configuration.timelines,
        this.importer,
        this.eventbus
      ),
    };

    let eventActions: IAction[] = [];
    if (configuration.eventActions?.length && actionRegistryListener) {
      eventActions = resolveEventActions(
        configuration.eventActions,
        actionRegistryListener,
        this.importer,
        this.eventbus
      );
    }

    const actionsLookup = (resolvedConfig.actions as IAction[])
      .concat(eventActions)
      .reduce<Record<string, IAction>>(
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
  importer: ISimpleResourceImporter,
  eventbus: IEventbus
) {
  const resolvedConfigs =
    eventActionConfigurations.map<IResolvedActionConfiguration>(config =>
      resolveActionConfiguration(config, importer)
    );

  return resolvedConfigs.map((config, index) => {
    const {eventName, eventTopic} = eventActionConfigurations[index];
    const eventAction = new Action(
      config.name,
      config.startOperations,
      eventbus
    );
    actionRegistryListener.registerAction(eventAction, eventName, eventTopic);
    return eventAction;
  });
}

function resolveTimelines(
  timelines: ITimelineConfiguration[],
  importer: ISimpleResourceImporter,
  eventbus: IEventbus
) {
  const resolve = resolveTimelineAction.bind(null, importer, eventbus);

  return timelines.map<IResolvedTimelineConfiguration>(config => ({
    ...config,
    timelineActions: config.timelineActions.map(resolve),
  }));
}

function resolveOperation(
  importer: ISimpleResourceImporter,
  operationConfig: IOperationConfiguration<TOperationData>
): IResolvedOperation {
  return {
    id: operationConfig.id,
    systemName: operationConfig.systemName,
    operationData: deepCopy(operationConfig.operationData) ?? {},
    instance: importer.import(operationConfig.systemName)[
      operationConfig.systemName
    ],
  };
}

function resolveActionConfiguration(
  config: IActionConfiguration,
  importer: ISimpleResourceImporter
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
  importer: ISimpleResourceImporter
): IResolvedEndableActionConfiguration {
  const resolve = resolveOperation.bind(null, importer);

  const action = resolveActionConfiguration(config, importer);

  return {
    ...action,
    endOperations: config.endOperations.map(resolve),
  };
}

function resolveTimelineAction(
  importer: ISimpleResourceImporter,
  eventbus: IEventbus,
  actionConfiguration: ITimelineActionConfiguration
) {
  const resolvedConfig = resolveEndableActionConfiguration(
    actionConfiguration,
    importer
  );
  const duration = {
    end: actionConfiguration.duration.end ?? -1,
    start: actionConfiguration.duration.start,
  };

  const {id, name, endOperations, startOperations} = resolvedConfig;
  const action = new TimelineAction(
    name,
    startOperations,
    endOperations,
    duration,
    eventbus
  );
  action.id = id;
  return action;
}

function resolveActions(
  actionConfigurations: IEndableActionConfiguration[],
  importer: ISimpleResourceImporter,
  eventbus: IEventbus
) {
  const resolvedConfigs =
    actionConfigurations.map<IResolvedEndableActionConfiguration>(config => {
      return resolveEndableActionConfiguration(config, importer);
    });

  return resolvedConfigs.map<EndableAction>(resolvedConfig => {
    const {name, endOperations, startOperations} = resolvedConfig;
    const action = new EndableAction(
      name,
      startOperations,
      endOperations,
      eventbus
    );
    action.id = resolvedConfig.id;
    return action;
  });
}

function resolvePlaceholders(
  configFragment: Record<string, any> | any[],
  rootConfig: any,
  importer: ISimpleResourceImporter
) {
  if (!isDefined(configFragment)) {
    return;
  }

  if (Array.isArray(configFragment)) {
    configFragment.forEach(item => {
      resolvePlaceholders(item, rootConfig, importer);
    });
  } else if (isObject(configFragment)) {
    Object.keys(configFragment).forEach(key => {
      resolvePlaceholder(key, configFragment, rootConfig, importer);
    });
  }
}

function resolvePlaceholder(
  key: PropertyKey,
  configFragment: any,
  rootConfig: any,
  importer: ISimpleResourceImporter
) {
  const configValue = configFragment[key];
  if (isString(configValue)) {
    if (configValue.startsWith('config:')) {
      const configProperty = configValue.substring(7, configValue.length);
      configFragment[key] = resolvePropertyChain(configProperty, rootConfig);
    } else if (configValue.startsWith('template:')) {
      const templateKey = configValue.substring(9, configValue.length);
      const template = importer.import(templateKey)[templateKey];
      configFragment[key] = template;
    } else if (configValue.startsWith('json:')) {
      const jsonKey = configValue.substring(5, configValue.length);
      const json = importer.import(jsonKey)[jsonKey];
      configFragment[key] = json;
    }
  } else if (isObject(configValue) || Array.isArray(configValue)) {
    resolvePlaceholders(configValue, rootConfig, importer);
  }
}
