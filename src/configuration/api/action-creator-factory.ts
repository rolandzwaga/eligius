import type {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import type {
  ExtractOperationDataType,
  IActionConfiguration,
  IEndableActionConfiguration,
  IEventActionConfiguration,
  ITimelineActionConfiguration,
  TOperationType,
} from '@configuration/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {v4 as uuidv4} from 'uuid';
import {
  assertKnownOperationName,
  getOperationNameByType,
  type TFluentOperationData,
  type TFluentOperationName,
} from './operation-lookup.ts';
import {syncInPlace} from './sync-in-place.ts';

/**
 *
 * Container factory capable of creating the different kinds of actions.
 * For each type of action a dedicated factory will be returned.
 *
 */
export class ActionCreatorFactory {
  constructor(private readonly configurationfactory: ConfigurationFactory) {}

  /**
   *
   * Starts the creation of an action in the `actions` list with the specified name
   *
   * @param name
   * @returns
   */
  createAction(name: string): EndableActionCreator {
    const creator = new EndableActionCreator(name, this);
    this.configurationfactory.addAction(creator.actionConfig);
    return creator;
  }

  /**
   *
   * Starts the creation of an action in the `initActions` list with the specified name
   *
   * @param name
   * @returns
   */
  createInitAction(name: string): EndableActionCreator {
    const creator = new EndableActionCreator(name, this);
    this.configurationfactory.addInitAction(creator.actionConfig);
    return creator;
  }

  /**
   *
   * Starts the creation of an action in the `eventActions` list with the specified name
   *
   * @param name
   * @param eventName the event that starts the action. Without it the action can
   * only be started by name (for example by a `DOMEventListenerController`).
   * @param eventTopic optional topic of the event
   * @returns
   */
  createEventAction(
    name: string,
    eventName?: string,
    eventTopic?: string
  ): ActionCreator {
    const creator = new ActionCreator(name, this);
    const config: Partial<IEventActionConfiguration> = creator.actionConfig;
    if (eventName !== undefined) {
      config.eventName = eventName;
    }
    if (eventTopic !== undefined) {
      config.eventTopic = eventTopic;
    }
    this.configurationfactory.addEventAction(creator.actionConfig);
    return creator;
  }

  /**
   *
   * Starts the creation of an action in the `timelineActions` list with the specified name and uri
   *
   * @param uri
   * @param name
   * @returns
   */
  createTimelineAction(uri: string, name: string): TimelineActionCreator {
    const creator = new TimelineActionCreator(name, this);
    this.configurationfactory.addTimelineAction(uri, creator.actionConfig);
    return creator;
  }

  /**
   *
   * Returns the fluent scope back to the `Configurationfactory`
   *
   * @returns
   */
  end() {
    return this.configurationfactory;
  }
}

/**
 *
 * A factory that assists in creating an action
 *
 */
export class ActionCreator<
  T extends IActionConfiguration = IActionConfiguration,
> {
  actionConfig: T;

  /**
   *
   * Initializes an action configuration with the given name
   *
   * @param name
   * @param factory
   */
  constructor(
    name: string | undefined,
    private readonly factory: ActionCreatorFactory
  ) {
    this.actionConfig = {
      name: name ?? '',
      id: uuidv4(),
      startOperations: [],
    } as unknown as T;
  }

  /**
   *
   * The unique id of the action
   *
   * @returns
   */
  getId() {
    return this.actionConfig.id;
  }

  /**
   *
   * Sets the name of the action
   *
   * @param name
   * @returns
   * @throws Error when the action is in `actions` or `eventActions` and another
   * action in those lists already has the name
   */
  setName(name: string) {
    // Optional calls: a creator may be constructed with a stand-in factory
    this.factory.end?.()?.assertUniqueActionName?.(name, this.actionConfig);
    this.actionConfig.name = name;
    return this;
  }

  /**
   *
   * Passes a copy of the internal state of the `ActionCreator` to the given callback.
   * When the callback returns a configuration, it replaces the action configuration
   * in the `ConfigurationFactory`.
   *
   * @param callBack
   * @returns
   */
  getConfiguration(callBack: (config: T) => T) {
    const copy = deepCopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      syncInPlace(this.actionConfig, deepCopy(newConfig));
    }
    return this;
  }

  /**
   *
   * Adds the operation data for a start operation specified by the given type
   *
   * @param operationClass
   * @param operationData
   * @returns
   * @throws Error when the function is not an operation, or when the operation
   * implementations are not loaded (the DOM-free `eligius/configuration-api` entry)
   */
  addStartOperationByType<
    T extends TOperationType,
    Dt extends Partial<ExtractOperationDataType<T>>,
  >(operationClass: T, operationData: Dt) {
    return this.addStartOperation(
      getOperationNameByType(
        operationClass,
        'addStartOperationByType',
        'addStartOperation'
      ),
      operationData
    );
  }

  /**
   *
   * Adds the operation data for a start operation specified by the given system name.
   * The operation data is copied, so later changes to the given object do not
   * affect the configuration.
   *
   * @param systemName a built-in operation name, or a name from the factory's
   * `customOperations` option
   * @param operationData
   * @returns
   * @throws Error when `systemName` is neither a built-in nor a declared custom operation
   */
  addStartOperation<
    T extends TFluentOperationName,
    O extends TFluentOperationData<T>,
  >(systemName: T, operationData: O) {
    assertKnownOperationName(systemName, this._customOperationNames());

    const {startOperations} = this.actionConfig;
    startOperations.push({
      id: uuidv4(),
      systemName: systemName,
      operationData: deepCopy(operationData),
    });
    return this;
  }

  /**
   *
   * Returns the fluent scope back to the `ActionCreatorFactory`
   *
   * @returns
   */
  next() {
    return this.factory;
  }

  /**
   * The custom operation names of the `ConfigurationFactory`. Optional calls:
   * a creator may be constructed with a stand-in factory.
   */
  protected _customOperationNames(): ReadonlySet<string> | undefined {
    return this.factory.end?.()?.customOperationNames;
  }
}

/**
 *
 * A factory that assists in creating an endable action
 *
 */
export class EndableActionCreator<
  T extends IEndableActionConfiguration = IEndableActionConfiguration,
> extends ActionCreator<T> {
  constructor(name: string | undefined, factory: ActionCreatorFactory) {
    super(name, factory);
    this.actionConfig.endOperations = [];
  }

  /**
   *
   * Adds the operation data for an end operation specified by the given type
   *
   * @param operationClass
   * @param operationData
   * @returns
   * @throws Error when the function is not an operation, or when the operation
   * implementations are not loaded (the DOM-free `eligius/configuration-api` entry)
   */
  addEndOperationByType<
    T extends TOperationType,
    Dt extends Partial<ExtractOperationDataType<T>>,
  >(operationClass: T, operationData: Dt) {
    return this.addEndOperation(
      getOperationNameByType(
        operationClass,
        'addEndOperationByType',
        'addEndOperation'
      ),
      operationData
    );
  }

  /**
   *
   * Adds the operation data for an end operation specified by the given system name.
   * The operation data is copied, so later changes to the given object do not
   * affect the configuration.
   *
   * @param systemName a built-in operation name, or a name from the factory's
   * `customOperations` option
   * @param operationData
   * @returns
   * @throws Error when `systemName` is neither a built-in nor a declared custom operation
   */
  addEndOperation<
    T extends TFluentOperationName,
    O extends TFluentOperationData<T>,
  >(systemName: T, operationData: O) {
    assertKnownOperationName(systemName, this._customOperationNames());

    let {endOperations} = this.actionConfig;
    if (!endOperations) {
      endOperations = this.actionConfig.endOperations = [];
    }
    endOperations.push({
      id: uuidv4(),
      systemName: systemName,
      operationData: deepCopy(operationData),
    });
    return this;
  }
}

/**
 *
 * A factory that assists in creating a timeline action
 *
 */
export class TimelineActionCreator extends EndableActionCreator<ITimelineActionConfiguration> {
  /**
   *
   * Sets the duration specified by the given start and optional end positions
   *
   * @param start
   * @param end
   * @returns
   * @throws Error when `end` is given and lower than `start`
   */
  addDuration(start: number, end?: number) {
    if (end !== undefined && start > end) {
      throw new Error(
        `addDuration: start (${start}) cannot be higher than end (${end})`
      );
    }
    this.actionConfig.duration = {
      start: start,
    };
    if (end !== undefined) {
      this.actionConfig.duration.end = end;
    }
    return this;
  }
}
