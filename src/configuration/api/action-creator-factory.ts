import { v4 as uuidv4 } from 'uuid';
import * as operations from '../../operation';
import { deepcopy } from '../../operation/helper/deepcopy';
import { TOperationData } from '../../operation/types';
import { IActionConfiguration, IEndableActionConfiguration, ITimelineActionConfiguration } from '../types';
import { ConfigurationFactory } from './configuration-factory';

export class ActionCreatorFactory {
  constructor(private readonly configurationfactory: ConfigurationFactory) {}

  createAction(name: string): ActionCreator {
    const creator = new ActionCreator(name, this);
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

export class ActionCreator<T extends IActionConfiguration = IActionConfiguration> {
  actionConfig: T;

  constructor(name: string | undefined, private readonly factory: ActionCreatorFactory) {
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
    const copy = deepcopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.actionConfig = newConfig;
    }
    return this;
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
  addEndOperation(systemName: string, operationData: TOperationData) {
    if (!(operations as Record<string, any>)[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    let { endOperations } = this.actionConfig;
    if (endOperations) {
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

export class TimelineActionCreator extends EndableActionCreator<ITimelineActionConfiguration> {
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
