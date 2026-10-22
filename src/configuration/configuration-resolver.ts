import {Action, EndableAction, TimelineAction} from '@action/index.ts';
import type {IAction} from '@action/types.ts';
import {
  effectiveContainerProvider,
  effectivePositionSource,
} from '@configuration/timeline-provider-overrides.ts';
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
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {isFunction} from '@util/guards/is-function.ts';
import {isObject} from '@util/guards/is-object.ts';
import {isPlainObject} from '@util/guards/is-plain-object.ts';
import {isString} from '@util/guards/is-string.ts';
import {isDefined} from 'ts-is-present';
import type {
  IConfigurationResolver,
  IDuration,
  ISimpleResourceImporter,
} from '../types.ts';

/**
 * Takes an `IEngineConfiguration` instance and return an `IResolvedEngineConfiguration`.
 * This means all system names within the configuration will be resolved to their associated instances.
 *
 * If the given configuration includes event actions, then those will be registered in the given
 * `ActionRegistryEventbusListener`. They are registered only after the whole configuration
 * has been accepted, so a configuration that `process` rejects leaves the listener untouched.
 *
 * Every error names the JSON path of the offending value.
 *
 * @throws When an operation's `systemName` does not resolve to an operation function (including
 * controller, timeline provider, custom function and class exports of the importer). The message
 * suggests the closest operation names the importer lists, which include the custom operations
 * registered with `EligiusResourceImporter`.
 * @throws When two actions (or an action and an event action) share the same name.
 * @throws When `actions`, `initActions`, `timelines`, an action's `startOperations` or
 * `endOperations`, or a timeline's `timelineActions` is not an array.
 * @throws When a timeline action has no valid `duration`, or when a timeline's `type` has no
 * entry in `timelineProviderSettings` and the timeline has no `positionSource` with a `systemName`
 * of its own.
 * @throws When a timeline's `positionSource` or `containerProvider` override is not an object,
 * names a `systemName` the importer does not provide, or leaves out a setting that the provider
 * requires (for example `selector` of `ScrollPositionSource`) once it is merged over the type's
 * settings.
 * @throws When a `template:`, `json:` or `config:` placeholder cannot be resolved.
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
      imported,
      ''
    );
    resolvePlaceholders(
      configuration,
      configuration,
      this.importer,
      'config',
      imported,
      ''
    );

    if (
      !isObject(configuration.timelineProviderSettings) &&
      !(
        configuration.timelineProviderSettings === undefined &&
        everyTimelineHasOwnPositionSource(configuration.timelines)
      )
    ) {
      throw new Error(
        `Configuration incomplete: it needs to have at least one timeline provider setting at timelineProviderSettings, got ${describeValue(configuration.timelineProviderSettings)}.`
      );
    }

    const resolvedConfig: IResolvedEngineConfiguration = {
      id: configuration.id,
      engine: {...configuration.engine},
      timelineProviderSettings:
        deepCopy(configuration.timelineProviderSettings) ?? {},
      containerSelector: configuration.containerSelector,
      cssFiles: deepCopy(configuration.cssFiles),
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

    assertTimelineProviderSettings(configuration, this.importer);

    let eventActions: IEventActionRegistration[] = [];
    if (isDefined(configuration.eventActions)) {
      assertArray(configuration.eventActions, 'eventActions');
      if (actionRegistryListener) {
        eventActions = resolveEventActions(
          configuration.eventActions,
          this.importer,
          this.eventbus
        );
      }
    }

    const actionsLookup = createActionsLookup([
      ...(resolvedConfig.actions as IAction[]).map(
        (action, index) => [action, `actions[${index}]`] as const
      ),
      ...eventActions.map(
        ({action}, index) => [action, `eventActions[${index}]`] as const
      ),
    ]);

    // Register only now that the configuration is accepted, so a rejected
    // configuration leaves no live event actions behind.
    for (const {action, eventName, eventTopic} of eventActions) {
      actionRegistryListener?.registerAction(action, eventName, eventTopic);
    }

    return [actionsLookup, resolvedConfig];
  }
}

interface IEventActionRegistration {
  action: IAction;
  eventName: string;
  eventTopic?: string;
}

/**
 * Describes a value for an error message by its kind only, so configuration
 * data never ends up in a message.
 */
function describeValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'object':
      return 'an object';
    case 'number':
      return Number.isFinite(value) ? String(value) : 'a non-finite number';
    case 'string':
      return 'a string';
    case 'boolean':
      return 'a boolean';
    default:
      return `a ${typeof value}`;
  }
}

function assertArray(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Invalid configuration at ${path}: expected an array, got ${describeValue(value)}.`
    );
  }
}

/**
 * Every timeline needs a position source: from the provider settings of its
 * type, or from a `positionSource` override with a `systemName` of its own.
 * Otherwise the engine silently has no position source for it.
 *
 * Overrides are checked here so a mistake fails at resolution with its JSON
 * path, not at init or on the first switch to the timeline.
 */
function assertTimelineProviderSettings(
  configuration: IEngineConfiguration,
  importer: ISimpleResourceImporter
) {
  const settings = configuration.timelineProviderSettings ?? {};
  configuration.timelines.forEach((timeline, index) => {
    const path = `timelines[${index}]`;
    const {type} = timeline;
    const typeSettings =
      Object.hasOwn(settings, type) && isObject(settings[type])
        ? settings[type]
        : undefined;

    assertProviderOverride(
      timeline.positionSource,
      `${path}.positionSource`,
      'position source',
      importer
    );
    assertProviderOverride(
      timeline.containerProvider,
      `${path}.containerProvider`,
      'container provider',
      importer
    );

    if (!typeSettings && !isString(timeline.positionSource?.systemName)) {
      throw new Error(
        `Missing timeline provider settings at timelineProviderSettings.${type} for ${path} (type '${type}'). Add a provider for the '${type}' timeline type, or give ${path}.positionSource a systemName of its own.`
      );
    }

    if (isDefined(timeline.positionSource)) {
      assertMergedProviderSettings(
        effectivePositionSource(timeline, typeSettings),
        `${path}.positionSource`,
        `timelineProviderSettings.${type}.positionSource`,
        'position source'
      );
    }
    if (isDefined(timeline.containerProvider)) {
      assertMergedProviderSettings(
        effectiveContainerProvider(timeline, typeSettings),
        `${path}.containerProvider`,
        `timelineProviderSettings.${type}.container`,
        'container provider'
      );
    }
  });
}

/**
 * True when there are timelines and every one names its own position source,
 * so the configuration needs no `timelineProviderSettings`.
 */
function everyTimelineHasOwnPositionSource(timelines: unknown): boolean {
  return (
    Array.isArray(timelines) &&
    timelines.length > 0 &&
    timelines.every(
      timeline =>
        isObject(timeline) &&
        isObject(timeline.positionSource) &&
        isString(timeline.positionSource.systemName)
    )
  );
}

/**
 * Settings that the built-in providers cannot work without. They are checked
 * for timelines that override their provider settings, after the merge.
 */
const REQUIRED_PROVIDER_SETTINGS: Record<string, readonly string[]> = {
  ScrollPositionSource: ['selector'],
  VideoPositionSource: ['selector', 'sources'],
  DomContainerProvider: ['selector'],
};

/**
 * Checks the shape of a per-timeline provider override and that its
 * `systemName`, when given, is provided by the importer.
 */
function assertProviderOverride(
  override: unknown,
  path: string,
  kind: string,
  importer: ISimpleResourceImporter
) {
  if (!isDefined(override)) {
    return;
  }
  if (!isObject(override)) {
    throw new Error(
      `Invalid configuration at ${path}: expected an object with ${kind} settings, got ${describeValue(override)}.`
    );
  }
  const {systemName} = override;
  if (!isDefined(systemName)) {
    return;
  }
  if (!isString(systemName)) {
    throw new Error(
      `Invalid configuration at ${path}.systemName: expected the name of a ${kind} class, got ${describeValue(systemName)}.`
    );
  }

  let entry: unknown;
  try {
    entry = importer.import(systemName)?.[systemName];
  } catch {
    entry = undefined;
  }
  if (!isFunction(entry)) {
    const didYouMean = formatDidYouMean(
      findClosestNames(
        systemName,
        getImporterNames(importer, 'getProviderNames')
      )
    );
    throw new Error(
      `Unknown ${kind} '${systemName}' at ${path}.systemName. ${
        didYouMean ||
        `Check the spelling, or make sure the ${kind} is available from the resource importer.`
      }`
    );
  }
  const isListedAs = (getterName: string) =>
    getImporterNames(importer, getterName).includes(systemName);
  if (
    !isListedAs('getProviderNames') &&
    (isListedAs('getOperationNames') || isListedAs('getControllerNames'))
  ) {
    throw new Error(
      `Unknown ${kind} '${systemName}' at ${path}.systemName: '${systemName}' is an operation or controller, not a ${kind}.`
    );
  }
}

/**
 * Checks the settings a timeline ends up with once its override is merged
 * over the settings of its type: a `systemName`, and the settings the
 * built-in provider of that name requires.
 */
function assertMergedProviderSettings(
  merged: Record<string, unknown> | undefined,
  path: string,
  typePath: string,
  kind: string
) {
  const systemName = merged?.systemName;
  if (!merged || !isString(systemName)) {
    throw new Error(
      `Missing systemName at ${path}.systemName: there are no settings at ${typePath} to merge the override over, so it has to name the ${kind} class.`
    );
  }
  const required = Object.hasOwn(REQUIRED_PROVIDER_SETTINGS, systemName)
    ? REQUIRED_PROVIDER_SETTINGS[systemName]
    : [];
  for (const key of required) {
    if (!hasRequiredSetting(merged, key)) {
      throw new Error(
        `Missing setting at ${path}.${key}: '${systemName}' requires '${key}', and neither ${path} nor ${typePath} provides it.`
      );
    }
  }
}

function hasRequiredSetting(
  settings: Record<string, unknown>,
  key: string
): boolean {
  if (key === 'sources') {
    // VideoPositionSource also takes its sources from options.sources
    const options = settings.options;
    const fromOptions = isObject(options) ? options.sources : undefined;
    return isNonEmptyArray(settings.sources) || isNonEmptyArray(fromOptions);
  }
  const value = settings[key];
  return isString(value) ? value.length > 0 : isDefined(value);
}

function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
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

/**
 * Creates the event actions without registering them.
 */
function resolveEventActions(
  eventActionConfigurations: IEventActionConfiguration[],
  importer: ISimpleResourceImporter,
  eventbus: IEventbus
): IEventActionRegistration[] {
  const resolvedConfigs =
    eventActionConfigurations.map<IResolvedActionConfiguration>(
      (config, index) =>
        resolveActionConfiguration(config, importer, `eventActions[${index}]`)
    );

  return resolvedConfigs.map((config, index) => {
    const {eventName, eventTopic} = eventActionConfigurations[index];
    return {
      action: new Action(config.name, config.startOperations, eventbus),
      eventName,
      eventTopic,
    };
  });
}

function resolveTimelines(
  timelines: ITimelineConfiguration[],
  importer: ISimpleResourceImporter,
  eventbus: IEventbus
) {
  assertArray(timelines, 'timelines');
  return timelines.map<IResolvedTimelineConfiguration>(
    (config, timelineIndex) => {
      const path = `timelines[${timelineIndex}]`;
      assertArray(config.timelineActions, `${path}.timelineActions`);
      return {
        ...config,
        // Copies, so the resolved configuration does not share the overrides
        ...(isDefined(config.positionSource) && {
          positionSource: deepCopy(config.positionSource),
        }),
        ...(isDefined(config.containerProvider) && {
          containerProvider: deepCopy(config.containerProvider),
        }),
        timelineActions: config.timelineActions.map((actionConfig, index) =>
          resolveTimelineAction(
            importer,
            eventbus,
            actionConfig,
            `${path}.timelineActions[${index}]`
          )
        ),
      };
    }
  );
}

function resolveOperation(
  importer: ISimpleResourceImporter,
  operationConfig: IOperationConfiguration<TOperationData>,
  path: string
): IResolvedOperation {
  const {systemName} = operationConfig;
  let instance: unknown;
  try {
    instance = importer.import(systemName)?.[systemName];
  } catch (error) {
    // Importers may throw for unknown names (EligiusResourceImporter does);
    // report it like a missing entry so the message keeps the JSON path.
    throw new Error(createUnknownOperationMessage(importer, systemName, path), {
      cause: error,
    });
  }

  if (!isFunction(instance)) {
    throw new Error(createUnknownOperationMessage(importer, systemName, path));
  }

  // The importer also serves controllers, timeline providers and classes, which
  // are functions as well, but cannot be called as an operation.
  const notAnOperation = describeNonOperation(importer, systemName, instance);
  if (notAnOperation) {
    throw new Error(
      `Unknown operation '${systemName}' at ${path}.systemName. ${notAnOperation}`
    );
  }

  return {
    id: operationConfig.id,
    systemName,
    operationData: deepCopy(operationConfig.operationData) ?? {},
    instance,
  };
}

/**
 * Returns why the given importer export is not an operation, or `undefined`
 * when it may be one.
 */
function describeNonOperation(
  importer: ISimpleResourceImporter,
  systemName: string,
  instance: (...args: any[]) => any
): string | undefined {
  const isListedAs = (getterName: string) =>
    getImporterNames(importer, getterName).includes(systemName);

  if (!isListedAs('getOperationNames')) {
    if (isListedAs('getControllerNames')) {
      return `'${systemName}' is a controller, not an operation: attach it with the addControllerToElement operation.`;
    }
    if (isListedAs('getProviderNames')) {
      return `'${systemName}' is a timeline provider export, not an operation: configure it in timelineProviderSettings.`;
    }
    if (isListedAs('getFunctionNames')) {
      return `'${systemName}' is a custom function, not an operation: call it with the customFunction operation ({systemName: '${systemName}'}).`;
    }
  }
  if (isClass(instance)) {
    return `'${systemName}' is a class, not an operation function.`;
  }
  return undefined;
}

function isClass(value: (...args: any[]) => any): boolean {
  return /^class[\s{]/.test(Function.prototype.toString.call(value));
}

function resolveOperations(
  importer: ISimpleResourceImporter,
  operationConfigs: IOperationConfiguration<TOperationData>[],
  path: string
) {
  assertArray(operationConfigs, path);
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
  const knownNames = getImporterNames(importer, 'getOperationNames');
  const didYouMean = formatDidYouMean(
    findClosestNames(String(systemName), knownNames)
  );

  if (didYouMean) {
    return `${message} ${didYouMean}`;
  }
  return `${message} Check the spelling, or make sure the operation is available from the resource importer.`;
}

/**
 * Calls one of the optional `IResourceImporter` name getters, an empty list when
 * the importer does not have it.
 */
function getImporterNames(
  importer: ISimpleResourceImporter,
  getterName: string
): string[] {
  const getter = (importer as unknown as Record<string, unknown>)[getterName];
  if (isFunction(getter)) {
    const names = getter.call(importer);
    return Array.isArray(names) ? names : [];
  }
  return [];
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

/**
 * Validates a timeline action duration: `start` is a number >= 0, `end` is
 * optional and, when given, not lower than `start`. An `end` of -1 marks an
 * open end, like a missing `end`.
 */
function resolveDuration(duration: unknown, path: string): Required<IDuration> {
  if (!isObject(duration)) {
    throw new Error(
      `Invalid configuration at ${path}: expected {start: number, end?: number}, got ${describeValue(duration)}.`
    );
  }
  const {start, end} = duration;
  if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) {
    throw new Error(
      `Invalid configuration at ${path}.start: expected a number >= 0, got ${describeValue(start)}.`
    );
  }
  if (!isDefined(end) || end === -1) {
    return {start, end: -1};
  }
  if (typeof end !== 'number' || !Number.isFinite(end)) {
    throw new Error(
      `Invalid configuration at ${path}.end: expected a number or no end, got ${describeValue(end)}.`
    );
  }
  if (end < start) {
    throw new Error(
      `Invalid configuration at ${path}.end: end (${end}) must not be lower than start (${start}).`
    );
  }
  return {start, end};
}

function resolveTimelineAction(
  importer: ISimpleResourceImporter,
  eventbus: IEventbus,
  actionConfiguration: ITimelineActionConfiguration,
  path: string
) {
  const duration = resolveDuration(
    actionConfiguration.duration,
    `${path}.duration`
  );
  const resolvedConfig = resolveEndableActionConfiguration(
    actionConfiguration,
    importer,
    path
  );

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
  assertArray(actionConfigurations, path);
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

/**
 * Walks arrays and plain data objects only. Class instances, jQuery objects and
 * other non-plain values (from the TypeScript API) are kept as they are.
 */
function resolvePlaceholders(
  configFragment: Record<string, any> | any[],
  rootConfig: any,
  importer: ISimpleResourceImporter,
  pass: TPlaceholderPass,
  imported: WeakSet<object>,
  path: string
) {
  if (!isDefined(configFragment) || imported.has(configFragment)) {
    return;
  }

  if (Array.isArray(configFragment)) {
    configFragment.forEach((_item, index) => {
      resolvePlaceholder(
        index,
        configFragment,
        rootConfig,
        importer,
        pass,
        imported,
        `${path}[${index}]`
      );
    });
  } else if (isPlainObject(configFragment)) {
    Object.keys(configFragment).forEach(key => {
      resolvePlaceholder(
        key,
        configFragment,
        rootConfig,
        importer,
        pass,
        imported,
        path ? `${path}.${key}` : key
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
  imported: WeakSet<object>,
  path: string
) {
  const configValue = configFragment[key];
  if (isString(configValue)) {
    if (pass === 'config') {
      if (configValue.startsWith('config:')) {
        configFragment[key] = resolveConfigPlaceholder(
          configValue,
          rootConfig,
          path
        );
      }
    } else if (configValue.startsWith('template:')) {
      const templateKey = configValue.substring(9, configValue.length);
      const template = importPlaceholder(
        importer,
        templateKey,
        configValue,
        path
      );
      configFragment[key] = template;
    } else if (configValue.startsWith('json:')) {
      const jsonKey = configValue.substring(5, configValue.length);
      // A copy, so the importer's own value is never rewritten when the
      // configuration is processed again
      const json = deepCopy(
        importPlaceholder(importer, jsonKey, configValue, path)
      );
      configFragment[key] = json;
      // Imported values are not walked for placeholders
      if (isPlainObject(json) || Array.isArray(json)) {
        imported.add(json);
      }
    }
  } else if (isPlainObject(configValue) || Array.isArray(configValue)) {
    resolvePlaceholders(
      configValue,
      rootConfig,
      importer,
      pass,
      imported,
      path
    );
  }
}

/**
 * Imports the value for a `template:` or `json:` placeholder. An importer that
 * throws for an unknown name gets its error wrapped, and an importer that returns
 * a record without an entry for the name is reported as an unknown name. Both
 * messages name the placeholder and its JSON path. An entry that is present but
 * `undefined` is accepted.
 */
function importPlaceholder(
  importer: ISimpleResourceImporter,
  name: string,
  placeholder: string,
  path: string
): unknown {
  let record: unknown;
  try {
    record = importer.import(name);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to resolve placeholder '${placeholder}' at ${path}: ${reason}`,
      {cause: error}
    );
  }
  if (!isObject(record) || !Object.hasOwn(record, name)) {
    throw new Error(
      `Unable to resolve placeholder '${placeholder}' at ${path}: unknown name '${name}'.`
    );
  }
  return record[name];
}

/**
 * Resolves a `config:` placeholder against the root configuration. When the target
 * is itself a `config:` placeholder, that one is followed as well.
 *
 * @throws When the property chain cannot be resolved or yields `undefined`.
 */
function resolveConfigPlaceholder(
  placeholder: string,
  rootConfig: any,
  path: string,
  visited: Set<string> = new Set()
): any {
  if (visited.has(placeholder)) {
    throw new Error(
      `Circular config: placeholder '${placeholder}' at ${path} (chain: ${[...visited, placeholder].join(' -> ')})`
    );
  }
  visited.add(placeholder);

  const configProperty = placeholder.substring(7, placeholder.length);
  let value: unknown;
  try {
    value = resolvePropertyChain(configProperty, rootConfig);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to resolve placeholder '${placeholder}' at ${path}: ${reason}`,
      {cause: error}
    );
  }
  if (value === undefined) {
    throw new Error(
      `Unable to resolve placeholder '${placeholder}' at ${path}: the configuration has no value at '${configProperty}'.`
    );
  }

  if (isString(value) && value.startsWith('config:')) {
    return resolveConfigPlaceholder(value, rootConfig, path, visited);
  }
  return value;
}
