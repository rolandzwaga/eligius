import {isDefined} from 'ts-is-present';
import {v4 as uuidv4} from 'uuid';
import {deepCopy} from '../../operation/helper/deep-copy.ts';
import * as operations from '../../operation/index.ts';
import type {TOperation, TOperationData} from '../../operation/types.ts';
import type {IDuration} from '../../types.ts';
import type {
  ExtractOperationDataType,
  GetOperationByName,
  IActionConfiguration,
  IEndableActionConfiguration,
  IOperationConfiguration,
  ITimelineActionConfiguration,
  TOperationName,
  TOperationType,
} from '../types.ts';
import type {ConfigurationFactory} from './configuration-factory.ts';

function array_move(arr: any[], old_index: number, new_index: number) {
  if (new_index >= arr.length) {
    new_index = 0;
  } else if (new_index < 0) {
    new_index = arr.length - 1;
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
}

/**
 *
 * A factory that assists in editing an action
 *
 */
export class ActionEditor<
  T extends IActionConfiguration = IActionConfiguration,
> {
  constructor(
    protected actionConfig: T,
    protected readonly configurationFactory: ConfigurationFactory
  ) {}

  updateConfiguration() {
    this.actionConfig = structuredClone(this.actionConfig);
  }

  /**
   *
   * Returns a copy of the current internal state of the factory
   *
   * @param callBack
   * @returns
   */
  getConfiguration(callBack: (config: T) => T | undefined) {
    const copy = deepCopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.actionConfig = newConfig;
    }
    return this;
  }

  /**
   *
   * Sets the action name
   *
   * @param name
   * @returns
   */
  setName(name: string) {
    this.actionConfig = {
      ...this.actionConfig,
      name,
    };
    return this;
  }

  /**
   *
   * Gets the action name
   *
   * @returns
   */
  getName() {
    return this.actionConfig.name;
  }

  /**
   *
   * Adds the operation data for a start operation specified by the given type
   *
   * @param operationClass
   * @param operationData
   * @returns
   */
  addStartOperationByType<T extends TOperation<TOperationData>>(
    operationClass: T,
    operationData: Partial<ExtractOperationDataType<T>>
  ): OperationEditor<this, T> {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addStartOperation(
        entries[0] as TOperationName,
        operationData
      ) as OperationEditor<this, T>;
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  /**
   *
   * Adds the operation data for a start operation specified by the given system name
   *
   * @param systemName
   * @param operationData
   * @param id
   * @returns
   */
  addStartOperation(
    systemName: TOperationName,
    operationData: TOperationData,
    id: string = uuidv4()
  ): OperationEditor<this, TOperation<TOperationData>> {
    if (!(operations as any)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    const startOperations = this.actionConfig.startOperations
      ? this.actionConfig.startOperations.slice()
      : [];

    const newConfig = {
      id,
      systemName: systemName,
      operationData: operationData,
    } as IOperationConfiguration<TOperation<TOperationData>>;

    startOperations.push(newConfig);

    this.actionConfig = {
      ...this.actionConfig,
      startOperations,
    };

    return new OperationEditor<this, TOperation<TOperationData>>(
      newConfig,
      this
    );
  }

  /**
   *
   * Starts an editor for the start operation associated with the given id
   *
   * @param id
   * @returns
   */
  editStartOperation(id: string) {
    const {startOperations} = this.actionConfig;
    const operation = startOperations.find(o => o.id === id);

    if (isDefined(operation)) {
      return new OperationEditor<ActionEditor<T>, TOperation<TOperationData>>(
        operation,
        this
      );
    }

    throw new Error(`start operation not found for id ${id}`);
  }

  /**
   *
   * Removes the start operation associated with the given id
   *
   * @param id
   * @returns
   */
  removeStartOperation(id: string) {
    const startOperations = this.actionConfig.startOperations
      ? this.actionConfig.startOperations.slice()
      : [];
    const operation = startOperations.find(o => o.id === id);

    if (!operation) {
      throw new Error(`start operation not found for id ${id}`);
    }

    const idx = startOperations.indexOf(operation);

    if (idx > -1) {
      startOperations.splice(idx, 1);
      this.actionConfig = {
        ...this.actionConfig,
        startOperations,
      };
    }

    return this;
  }

  /**
   *
   * Moves the start operation associated with the given id in the given direction
   *
   * @param id
   * @param direction
   * @returns
   */
  moveStartOperation(id: string, direction: 'up' | 'down') {
    const startOperations = this.actionConfig.startOperations
      ? this.actionConfig.startOperations.slice()
      : [];
    const operation = startOperations.find(o => o.id === id);

    if (!operation) {
      throw new Error(`start operation not found for id ${id}`);
    }

    const idx = startOperations.indexOf(operation);

    if (idx > -1) {
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      array_move(startOperations, idx, newIdx);
      this.actionConfig = {
        ...this.actionConfig,
        startOperations,
      };
    }

    return this;
  }

  /**
   *
   * Return the fluent scopt to the `ConfigurationFactory`
   *
   * @returns
   */
  next() {
    return this.configurationFactory;
  }
}

/**
 *
 * A factory that assists in editing an endable action
 *
 */
export class EndableActionEditor<
  T extends IEndableActionConfiguration = IEndableActionConfiguration,
> extends ActionEditor<T> {
  /**
   *
   * Adds the operation data for a end operation specified by the given type
   *
   * @param operationClass
   * @param operationData
   * @returns
   */
  addEndOperationByType<
    T extends TOperationType,
    Dt extends Partial<ExtractOperationDataType<T>>,
  >(
    operationClass: T,
    operationData: Dt
  ): OperationEditor<this, TOperationType> {
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
   * Adds the operation data for a start operation specified by the given system name
   *
   * @param systemName
   * @param operationData
   * @returns
   */
  addEndOperation<
    T extends TOperationName,
    O extends Partial<ExtractOperationDataType<GetOperationByName<T>>>,
  >(systemName: TOperationName, operationData: O) {
    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: Dynamic operation lookup is intentional for configuration API
    if (!operations[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    const endOperations = this.actionConfig.endOperations
      ? this.actionConfig.endOperations.slice()
      : [];

    const newConfig = {
      id: uuidv4(),
      systemName: systemName,
      operationData: operationData,
    };

    endOperations.push(newConfig);

    this.actionConfig.endOperations = endOperations;

    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: Dynamic operation lookup is intentional for configuration API
    const operationCsl = operations[systemName];
    return new OperationEditor<this, typeof operationCsl>(newConfig, this);
  }

  /**
   *
   * Starts an editor for the end operation associated with the given id
   *
   * @param id
   * @returns
   */
  editEndOperation(id: string) {
    const {endOperations} = this.actionConfig;
    const operationConfig = endOperations.find(o => o.id === id);

    if (isDefined(operationConfig)) {
      return new OperationEditor<this>(operationConfig, this);
    }

    throw new Error(`operation not found for id ${id}`);
  }

  /**
   *
   * Removes the end operation associated with the given id
   *
   * @param id
   * @returns
   */
  removeEndOperation(id: string) {
    const endOperations = this.actionConfig.endOperations
      ? this.actionConfig.endOperations.slice()
      : [];
    const operation = endOperations.find(o => o.id === id);

    if (!isDefined(operation)) {
      throw new Error(`operation not found for id ${id}`);
    }

    const idx = endOperations.indexOf(operation);

    if (idx > -1) {
      endOperations.splice(idx, 1);
      this.actionConfig = {
        ...this.actionConfig,
        endOperations,
      };
    }

    return this;
  }

  /**
   *
   * Moves the end operation associated with the given id in the specified direction
   *
   * @param id
   * @param direction
   * @returns
   */
  moveEndOperation(id: string, direction: 'up' | 'down') {
    const endOperations = this.actionConfig.endOperations
      ? this.actionConfig.endOperations.slice()
      : [];
    const operation = endOperations.find(o => o.id === id);

    if (!isDefined(operation)) {
      throw new Error(`operation not found for id ${id}`);
    }

    const idx = endOperations.indexOf(operation);

    if (idx > -1) {
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      array_move(endOperations, idx, newIdx);
      this.actionConfig = {
        ...this.actionConfig,
        endOperations,
      };
    }
    return this;
  }
}

/**
 *
 * A factory that assists in editing a timeline action
 *
 */
export class TimelineActionEditor extends EndableActionEditor<ITimelineActionConfiguration> {
  /**
   *
   * Sets the duration specified by the given start and optional end positions
   *
   * @param start
   * @param end
   * @returns
   */
  setDuration(start: number, end?: number) {
    if (end !== undefined && start > end) {
      throw Error('start position cannot be higher than end position');
    }

    const duration: IDuration = {
      start,
    };

    if (end) {
      duration.end = end;
    }

    this.actionConfig = {
      ...this.actionConfig,
      duration,
    };
    return this;
  }
}

/**
 *
 * A factory that assists in editing an operation
 *
 */
export class OperationEditor<
  T extends ActionEditor,
  O extends TOperationType = TOperation<TOperationData>,
> {
  constructor(
    private operationConfig: IOperationConfiguration<
      ExtractOperationDataType<O>
    >,
    private actionEditor: T
  ) {}

  /**
   *
   * Invokes the given callback with a copy of the internal state of the factory
   *
   * @param callBack
   * @returns
   */
  getConfiguration(
    callBack: (
      config: IOperationConfiguration<ExtractOperationDataType<O>>
    ) => IOperationConfiguration<ExtractOperationDataType<O>>
  ) {
    const copy = deepCopy(this.operationConfig);
    const newConfig = callBack.call(this, copy);

    if (newConfig) {
      this.operationConfig = newConfig;
    }

    return this;
  }

  /**
   *
   * Gets the system name
   *
   * @returns
   */
  getSystemName() {
    return this.operationConfig.systemName;
  }

  /**
   *
   * Sets the system name
   *
   * @param systemName
   * @returns
   */
  setSystemName(systemName: TOperationName) {
    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: Dynamic operation lookup is intentional for configuration API
    if (!operations[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    this.operationConfig.systemName = systemName;
    this.actionEditor.updateConfiguration();
    return this;
  }

  /**
   *
   * Sets the operation data
   *
   * @param operationData
   * @returns
   */
  setOperationData(operationData: ExtractOperationDataType<O>) {
    this.operationConfig.operationData = operationData;
    this.actionEditor.updateConfiguration();
    return this;
  }

  /**
   *
   * Sets the value on the current `operationData` with the given key
   *
   * @param key
   * @param value
   * @returns
   */
  setOperationDataItem(
    key: keyof ExtractOperationDataType<O>,
    value: ExtractOperationDataType<O>[keyof ExtractOperationDataType<O>]
  ) {
    let {operationData} = this.operationConfig;
    if (!operationData) {
      operationData = {} as ExtractOperationDataType<O>;
    }
    operationData[key] = value;
    return this.setOperationData(operationData);
  }

  /**
   *
   * returns all of the defined property names on the current `operationData`
   *
   * @returns
   */
  getOperationDataKeys(): keyof ExtractOperationDataType<O> {
    const {operationData} = this.operationConfig;
    return (operationData
      ? Object.keys(operationData)
      : []) as unknown as keyof ExtractOperationDataType<O>;
  }

  /**
   *
   * Gets the value of the given key on the current `operationData`
   *
   * @param key
   * @returns
   */
  getOperationDataValue(key: keyof ExtractOperationDataType<O>) {
    const {operationData} = this.operationConfig;
    return operationData?.[key];
  }

  /**
   *
   * Returns the fluent scope back to the action editor
   *
   * @returns
   */
  next() {
    return this.actionEditor;
  }
}
