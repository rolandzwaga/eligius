import { v4 as uuidv4 } from 'uuid';
import * as operations from '../../operation/index.ts';
import { deepCopy } from '../../operation/helper/deep-copy.ts';
import type { TOperation, TOperationData } from '../../operation/types.ts';
import type {
  ExtractDataType,
  IActionConfiguration,
  IEndableActionConfiguration,
  ITimelineActionConfiguration,
} from '../types.ts';
import { ConfigurationFactory } from './configuration-factory.ts';

export class ActionCreatorFactory {
  constructor(private readonly configurationfactory: ConfigurationFactory) {}

  createAction(name: string): EndableActionCreator {
    const creator = new EndableActionCreator(name, this);
    this.configurationfactory.addAction(creator.actionConfig);
    return creator;
  }

  createInitAction(name: string): EndableActionCreator {
    const creator = new EndableActionCreator(name, this);
    this.configurationfactory.addInitAction(creator.actionConfig);
    return creator;
  }

  createEventAction(name: string): ActionCreator {
    const creator = new ActionCreator(name, this);
    this.configurationfactory.addEventAction(creator.actionConfig);
    return creator;
  }

  createTimelineAction(uri: string, name: string): TimelineActionCreator {
    const creator = new TimelineActionCreator(name, this);
    this.configurationfactory.addTimelineAction(uri, creator.actionConfig);
    return creator;
  }

  end() {
    return this.configurationfactory;
  }
}

export class ActionCreator<
  T extends IActionConfiguration = IActionConfiguration
> {
  actionConfig: T;

  constructor(
    name: string | undefined,
    private readonly factory: ActionCreatorFactory
  ) {
    this.actionConfig = {
      name: '',
      id: uuidv4(),
      startOperations: [],
    } as any;
    if (name?.length) {
      this.actionConfig.name = name;
    }
  }

  getId() {
    return this.actionConfig.id;
  }

  setName(name: string) {
    this.actionConfig.name = name;
    return this;
  }

  getConfiguration(callBack: (config: T) => T) {
    const copy = deepCopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.actionConfig = newConfig;
    }
    return this;
  }

  addStartOperationByType<T extends TOperation<any>>(
    operationClass: T,
    operationData: Partial<ExtractDataType<T>>
  ) {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addStartOperation(entries[0], operationData);
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  addStartOperation(systemName: string, operationData: TOperationData) {
    if (!(operations as Record<string, any>)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    const { startOperations } = this.actionConfig;
    startOperations.push({
      id: uuidv4(),
      systemName: systemName,
      operationData: operationData,
    });
    return this;
  }

  next() {
    return this.factory;
  }
}

export class EndableActionCreator<
  T extends IEndableActionConfiguration = IEndableActionConfiguration
> extends ActionCreator<T> {
  constructor(name: string | undefined, factory: ActionCreatorFactory) {
    super(name, factory);
    this.actionConfig.endOperations = [];
  }

  addEndOperationByType<T extends TOperation<any>>(
    operationClass: T,
    operationData: Partial<ExtractDataType<T>>
  ) {
    const entries = Object.entries(operations).find(
      ([, value]) => value === operationClass
    );

    if (entries) {
      return this.addEndOperation(entries[0], operationData);
    }

    throw new Error(`Operation class not found: ${operationClass.toString()}`);
  }

  addEndOperation(systemName: string, operationData: TOperationData) {
    if (!(operations as Record<string, any>)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    let { endOperations } = this.actionConfig;
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

export class TimelineActionCreator extends EndableActionCreator<
  ITimelineActionConfiguration
> {
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
