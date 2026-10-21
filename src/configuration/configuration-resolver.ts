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
import {isFunction} from '@util/guards/is-function.ts';
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
 * @throws When an operation's `systemName` does not resolve to an operation function.
 * The message names the JSON path of the offending `systemName` and suggests the closest known operation names.
 * @throws When two actions (or an action and an event action) share the same name.
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
    // Resolve the imported placeholders (template:, json:) first, so that a config:
    // placeholder always sees the resolved value, regardless of property order.
    const imported = new WeakSet<object>();
    resolvePlaceholders(
      configuration,
      configuration,
      this.importer,
      'import',
      imported
    );
    resolvePlaceholders(
      configuration,
      configuration,
      this.importer,
      'config',
      imported
    );

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
        this.eventbus,
        'actions'
      ),
      initActions: resolveActions(
        configuration.initActions,
        this.importer,
        this.eventbus,
        'initActions'
      ),
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

    const actionsLookup = createActionsLookup([
      ...(resolvedConfig.actions as IAction[]).map(
        (action, index) => [action, `actions[${index}]`] as const
      ),
      ...eventActions.map(
        (action, index) => [action, `eventActions[${index}]`] as const
      ),
    ]);

    return [actionsLookup, resolvedConfig];
  }
}

function createActionsLookup(
  actions: (readonly [IAction, string])[]
): Record<string, IAction> {
  // Null prototype objects, so that an action named '__proto__' cannot alter the prototype
  const lookup: Record<string, IAction> = Object.create(null);
  const paths: Record<string, string> = Object.create(null);

  for (const [action, path] of actions) {
    if (Object.hasOwn(lookup, action.name)) {
      throw new Error(
        `Duplicate action name '${action.name}' at ${paths[action.name]}.name and ${path}.name. Action names must be unique across actions and eventActions, rename one of them.`
      );
    }
    lookup[action.name] = action;
    paths[action.name] = path;
  }

  return lookup;
}

function resolveEventActions(
  eventActionConfigurations: IEventActionConfiguration[],
  actionRegistryListener: ActionRegistryEventbusListener,
  importer: ISimpleResourceImporter,
  eventbus: IEventbus
) {
  const resolvedConfigs =
    eventActionConfigurations.map<IResolvedActionConfiguration>(
      (config, index) =>
        resolveActionConfiguration(config, importer, `eventActions[${index}]`)
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
  return timelines.map<IResolvedTimelineConfiguration>(
    (config, timelineIndex) => ({
      ...config,
      timelineActions: config.timelineActions.map((actionConfig, index) =>
        resolveTimelineAction(
          importer,
          eventbus,
          actionConfig,
          `timelines[${timelineIndex}].timelineActions[${index}]`
        )
      ),
    })
  );
}

function resolveOperation(
  importer: ISimpleResourceImporter,
  operationConfig: IOperationConfiguration<TOperationData>,
  path: string
): IResolvedOperation {
  const {systemName} = operationConfig;
  const instance = importer.import(systemName)[systemName];

  if (!isFunction(instance)) {
    throw new Error(createUnknownOperationMessage(importer, systemName, path));
  }

  return {
    id: operationConfig.id,
    systemName,
    operationData: deepCopy(operationConfig.operationData) ?? {},
    instance,
  };
}

function resolveOperations(
  importer: ISimpleResourceImporter,
  operationConfigs: IOperationConfiguration<TOperationData>[],
  path: string
) {
  return operationConfigs.map((operationConfig, index) =>
    resolveOperation(importer, operationConfig, `${path}[${index}]`)
  );
}

function createUnknownOperationMessage(
  importer: ISimpleResourceImporter,
  systemName: string,
  path: string
) {
  const message = `Unknown operation '${systemName}' at ${path}.systemName.`;
  const knownNames = getKnownOperationNames(importer);
  const suggestions = findClosestNames(String(systemName), knownNames);

  if (suggestions.length) {
    return `${message} Did you mean ${suggestions.map(name => `'${name}'`).join(', ')}?`;
  }
  return `${message} Check the spelling, or make sure the operation is available from the resource importer.`;
}

function getKnownOperationNames(importer: ISimpleResourceImporter): string[] {
  const getOperationNames = (importer as {getOperationNames?: unknown})
    .getOperationNames;
  if (isFunction(getOperationNames)) {
    const names = getOperationNames.call(importer);
    return Array.isArray(names) ? names : [];
  }
  return [];
}

function findClosestNames(name: string, knownNames: string[], max = 3) {
  const lowerName = name.toLowerCase();
  const maxDistance = Math.max(2, Math.floor(name.length / 3));

  return knownNames
    .map(knownName => ({
      knownName,
      distance: levenshtein(lowerName, knownName.toLowerCase()),
    }))
    .filter(({distance}) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max)
    .map(({knownName}) => knownName);
}

function levenshtein(a: string, b: string) {
  let previous = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function resolveActionConfiguration(
  config: IActionConfiguration,
  importer: ISimpleResourceImporter,
  path: string
): IResolvedActionConfiguration {
  return {
    id: config.id,
    name: config.name,
    startOperations: resolveOperations(
      importer,
      config.startOperations,
      `${path}.startOperations`
    ),
  };
}

function resolveEndableActionConfiguration(
  config: IEndableActionConfiguration,
  importer: ISimpleResourceImporter,
  path: string
): IResolvedEndableActionConfiguration {
  const action = resolveActionConfiguration(config, importer, path);

  return {
    ...action,
    endOperations: resolveOperations(
      importer,
      config.endOperations,
      `${path}.endOperations`
    ),
  };
}

function resolveTimelineAction(
  importer: ISimpleResourceImporter,
  eventbus: IEventbus,
  actionConfiguration: ITimelineActionConfiguration,
  path: string
) {
  const resolvedConfig = resolveEndableActionConfiguration(
    actionConfiguration,
    importer,
    path
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
  eventbus: IEventbus,
  path: string
) {
  const resolvedConfigs =
    actionConfigurations.map<IResolvedEndableActionConfiguration>(
      (config, index) => {
        return resolveEndableActionConfiguration(
          config,
          importer,
          `${path}[${index}]`
        );
      }
    );

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

/**
 * `import` resolves the `template:` and `json:` placeholders, `config:` resolves the `config:` placeholders.
 */
type TPlaceholderPass = 'import' | 'config';

function resolvePlaceholders(
  configFragment: Record<string, any> | any[],
  rootConfig: any,
  importer: ISimpleResourceImporter,
  pass: TPlaceholderPass,
  imported: WeakSet<object>
) {
  if (!isDefined(configFragment) || imported.has(configFragment)) {
    return;
  }

  if (Array.isArray(configFragment)) {
    configFragment.forEach(item => {
      resolvePlaceholders(item, rootConfig, importer, pass, imported);
    });
  } else if (isObject(configFragment)) {
    Object.keys(configFragment).forEach(key => {
      resolvePlaceholder(
        key,
        configFragment,
        rootConfig,
        importer,
        pass,
        imported
      );
    });
  }
}

function resolvePlaceholder(
  key: PropertyKey,
  configFragment: any,
  rootConfig: any,
  importer: ISimpleResourceImporter,
  pass: TPlaceholderPass,
  imported: WeakSet<object>
) {
  const configValue = configFragment[key];
  if (isString(configValue)) {
    if (pass === 'config') {
      if (configValue.startsWith('config:')) {
        configFragment[key] = resolveConfigPlaceholder(configValue, rootConfig);
      }
    } else if (configValue.startsWith('template:')) {
      const templateKey = configValue.substring(9, configValue.length);
      const template = importer.import(templateKey)[templateKey];
      configFragment[key] = template;
    } else if (configValue.startsWith('json:')) {
      const jsonKey = configValue.substring(5, configValue.length);
      const json = importer.import(jsonKey)[jsonKey];
      configFragment[key] = json;
      // Imported values are not walked for placeholders
      if (isObject(json) || Array.isArray(json)) {
        imported.add(json);
      }
    }
  } else if (isObject(configValue) || Array.isArray(configValue)) {
    resolvePlaceholders(configValue, rootConfig, importer, pass, imported);
  }
}

/**
 * Resolves a `config:` placeholder against the root configuration. When the target
 * is itself a `config:` placeholder, that one is followed as well.
 */
function resolveConfigPlaceholder(
  placeholder: string,
  rootConfig: any,
  visited: Set<string> = new Set()
): any {
  if (visited.has(placeholder)) {
    throw new Error(
      `Circular config: placeholder '${placeholder}' (chain: ${[...visited, placeholder].join(' -> ')})`
    );
  }
  visited.add(placeholder);

  const configProperty = placeholder.substring(7, placeholder.length);
  const value = resolvePropertyChain(configProperty, rootConfig);

  if (isString(value) && value.startsWith('config:')) {
    return resolveConfigPlaceholder(value, rootConfig, visited);
  }
  return value;
}
