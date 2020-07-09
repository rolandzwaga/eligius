import deepcopy from '../operation/helper/deepcopy';
import {
  IAction,
  TOperationData,
  IOperationInfo,
  IResolvedActionConfiguration,
  TActionContext,
  TOperationResult,
} from './types';
import { IEventbus } from '../eventbus/types';

class Action implements IAction {
  name: string;
  startOperations: IOperationInfo[];

  constructor(actionConfiguration: IResolvedActionConfiguration, private eventbus: IEventbus) {
    this.name = actionConfiguration.name;
    this.startOperations = actionConfiguration.startOperations;
  }

  start(initOperationData?: TOperationData): Promise<TOperationData> {
    const context = {};
    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(this.startOperations, 0, resolve, reject, initOperationData, context);
    }).catch((e) => {
      console.error(`Error in action start '${this.name}'`);
      console.error(e);
      throw e;
    });
    return result;
  }

  executeOperation(
    operations: IOperationInfo[],
    idx: number,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    previousOperationData: TOperationData | undefined,
    context: TActionContext
  ): void {
    previousOperationData = previousOperationData || {};
    if (context.hasOwnProperty('newIndex')) {
      idx = context.newIndex;
      delete context.newIndex;
    }
    context.currentIndex = idx;
    if (context.skip) {
      if (idx < operations.length) {
        this.executeOperation(operations, ++idx, resolve, reject, previousOperationData, context);
      } else {
        resolve(previousOperationData);
      }
    }

    if (idx < operations.length) {
      const operationInfo = operations[idx];
      const copy = operationInfo.operationData ? deepcopy(operationInfo.operationData) : {};
      const mergedOperationData = Object.assign(previousOperationData, copy);

      const result: TOperationResult = operationInfo.instance.call(context, mergedOperationData, this.eventbus);

      if (result.then) {
        result
          .then((resultOperationData: TOperationData) => {
            this.executeOperation(operations, ++idx, resolve, reject, resultOperationData, context);
          })
          .catch((error: any) => {
            reject(error);
          });
      } else {
        this.executeOperation(operations, ++idx, resolve, reject, result, context);
      }
    } else {
      resolve(previousOperationData);
    }
  }
}

export default Action;
