import {v4 as uuidv4} from 'uuid';
import {deepCopy} from '../../operation/helper/deep-copy.ts';
import * as operations from '../../operation/index.ts';
import type {TOperation, TOperationData} from '../../operation/types.ts';
import type {
  ExtractOperationDataType,
  GetOperationByName,
  IActionConfiguration,
  IEndableActionConfiguration,
  ITimelineActionConfiguration,
  TOperationName,
  TOperationType,
} from '../types.ts';
import type {ConfigurationFactory} from './configuration-factory.ts';

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
   * @returns
   */
  createEventAction(name: string): ActionCreator {
    const creator = new ActionCreator(name, this);
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
   */
  setName(name: string) {
    this.actionConfig.name = name;
    return this;
  }

  /**
   *
   * Returns a copy of the internal state of the `ActionCreator`
   *
   * @param callBack
   * @returns
   */
  getConfiguration(callBack: (config: T) => T) {
    const copy = deepCopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.actionConfig = newConfig;
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
   */
  addStartOperationByType<
    T extends TOperationType,
    Dt extends Partial<ExtractOperationDataType<T>>,
  >(operationClass: T, operationData: Dt) {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addStartOperation(
        entries[0] as TOperationName,
        operationData
      );
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  /**
   *
   * Adds the operation data for a start operation specified by the given system name
   *
   * @param systemName
   * @param operationData
   * @returns
   */
  addStartOperation<
    T extends TOperationName,
    O extends Partial<ExtractOperationDataType<GetOperationByName<T>>>,
  >(systemName: T, operationData: O) {
    if (!(operations as Record<string, any>)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    const {startOperations} = this.actionConfig;
    startOperations.push({
      id: uuidv4(),
      systemName: systemName,
      operationData: operationData,
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
   */
  addEndOperationByType<
    T extends TOperationType,
    Dt extends Partial<ExtractOperationDataType<T>>,
  >(operationClass: T, operationData: Dt) {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addEndOperation(entries[0] as TOperationName, operationData);
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  /**
   *
   * Adds the operation data for an end operation specified by the given system name
   *
   * @param systemName
   * @param operationData
   * @returns
   */
  addEndOperation<
    T extends TOperationName,
    O extends Partial<ExtractOperationDataType<GetOperationByName<T>>>,
  >(systemName: TOperationName, operationData: O) {
    if (!operations[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    let {endOperations} = this.actionConfig;
    if (!endOperations) {
      endOperations = this.actionConfig.endOperations = [];
    }
    endOperations.push({
      id: uuidv4(),
      systemName: systemName,
      operationData: operationData,
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
   */
  addDuration(start: number, end?: number) {
    this.actionConfig.duration = {
      start: start,
    };
    if (end) {
      this.actionConfig.duration.end = end;
    }
    return this;
  }
}
