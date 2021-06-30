import { v4 as uuidv4 } from 'uuid';
import * as operations from '../../operation';
import { deepCopy } from '../../operation/helper/deep-copy';
import { TOperation, TOperationData } from '../../operation/types';
import { IDuration } from '../../types';
import {
  ExtractDataType,
  IActionConfiguration,
  IEndableActionConfiguration,
  IOperationConfiguration,
  ITimelineActionConfiguration,
} from '../types';
import { ConfigurationFactory } from './configuration-factory';

function array_move(arr: any[], old_index: number, new_index: number) {
  if (new_index >= arr.length) {
    new_index = 0;
  } else if (new_index < 0) {
    new_index = arr.length - 1;
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
}

export class ActionEditor<
  T extends IActionConfiguration = IActionConfiguration
> {
  constructor(
    protected actionConfig: T,
    protected readonly configurationFactory: ConfigurationFactory
  ) {}

  updateConfiguration() {
    this.actionConfig = {
      ...this.actionConfig,
    };
  }

  getConfiguration(callBack: (config: T) => T | undefined) {
    const copy = deepCopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.actionConfig = newConfig;
    }
    return this;
  }

  setName(name: string) {
    this.actionConfig = {
      ...this.actionConfig,
      name,
    };
    return this;
  }

  getName() {
    return this.actionConfig.name;
  }

  addStartOperationByType<T extends TOperation<any>>(
    operationClass: T,
    operationData: Partial<ExtractDataType<T>>
  ): OperationEditor<this> {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addStartOperation(entries[0], operationData);
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  addStartOperation(
    systemName: string,
    operationData: TOperationData,
    id?: string
  ): OperationEditor<this> {
    if (!(operations as any)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    const startOperations = this.actionConfig.startOperations
      ? this.actionConfig.startOperations.slice()
      : [];

    const newConfig = {
      id: id ?? uuidv4(),
      systemName: systemName,
      operationData: operationData,
    };

    startOperations.push(newConfig);

    this.actionConfig = {
      ...this.actionConfig,
      startOperations,
    };

    return new OperationEditor<this>(newConfig, this);
  }

  editStartOperation(id: string) {
    const { startOperations } = this.actionConfig;
    const operation = startOperations.find(o => o.id === id);

    if (operation) {
      return new OperationEditor<ActionEditor<T>>(operation, this);
    }

    throw new Error(`start operation not found for id ${id}`);
  }

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

  next() {
    return this.configurationFactory;
  }
}

export class EndableActionEditor<
  T extends IEndableActionConfiguration = IEndableActionConfiguration
> extends ActionEditor<T> {
  addEndOperationByType<T extends TOperation<any>>(
    operationClass: T,
    operationData: Partial<ExtractDataType<T>>
  ): OperationEditor<this> {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addEndOperation(entries[0], operationData);
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  addEndOperation(systemName: string, operationData: TOperationData) {
    if (!(operations as any)[systemName]) {
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

    return new OperationEditor<this>(newConfig, this);
  }

  editEndOperation(id: string) {
    const { endOperations } = this.actionConfig;
    const operationConfig = endOperations.find(o => o.id === id);

    if (operationConfig) {
      return new OperationEditor<this>(operationConfig, this);
    }

    throw new Error(`operation not found for id ${id}`);
  }

  removeEndOperation(id: string) {
    const endOperations = this.actionConfig.endOperations
      ? this.actionConfig.endOperations.slice()
      : [];
    const operation = endOperations.find(o => o.id === id);

    if (!operation) {
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

  moveEndOperation(id: string, direction: 'up' | 'down') {
    const endOperations = this.actionConfig.endOperations
      ? this.actionConfig.endOperations.slice()
      : [];
    const operation = endOperations.find(o => o.id === id);

    if (!operation) {
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

export class TimelineActionEditor extends EndableActionEditor<
  ITimelineActionConfiguration
> {
  setDuration(start: number, end?: number) {
    if (end != undefined && start > end) {
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

export class OperationEditor<T extends ActionEditor> {
  constructor(
    private operationConfig: IOperationConfiguration,
    private actionEditor: T
  ) {}

  getConfiguration(
    callBack: (config: IOperationConfiguration) => IOperationConfiguration
  ) {
    const copy = deepCopy(this.operationConfig);
    const newConfig = callBack.call(this, copy);

    if (newConfig) {
      this.operationConfig = newConfig;
    }

    return this;
  }

  getSystemName() {
    return this.operationConfig.systemName;
  }

  setSystemName(systemName: string) {
    if (!(operations as any)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    this.operationConfig.systemName = systemName;
    this.actionEditor.updateConfiguration();
    return this;
  }

  setOperationData(operationData: TOperationData) {
    this.operationConfig.operationData = operationData;
    this.actionEditor.updateConfiguration();
    return this;
  }

  setOperationDataItem(key: string, value: any) {
    const { operationData = {} } = this.operationConfig;
    operationData[key] = value;
    return this.setOperationData(operationData);
  }

  getOperationDataKeys() {
    const { operationData } = this.operationConfig;
    return operationData ? Object.keys(operationData) : [];
  }

  getOperationDataValue(key: string) {
    const { operationData } = this.operationConfig;
    return operationData?.[key];
  }

  next() {
    return this.actionEditor;
  }
}
