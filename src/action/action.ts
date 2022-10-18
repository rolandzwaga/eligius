import { IResolvedOperation } from '../configuration/types';
import { IEventbus } from '../eventbus/types';
import { deepCopy } from '../operation/helper/deep-copy';
import {
  IOperationContext,
  TOperationData,
  TOperationResult
} from '../operation/types';
import { isPromise } from './is-promise';
import { IAction } from './types';

export class Action implements IAction {
  public id = '';

  constructor(
    public name: string,
    public startOperations: IResolvedOperation[],
    protected eventbus: IEventbus
  ) {}

  start(initOperationData?: TOperationData): Promise<TOperationData> {
    const context: IOperationContext = {
      currentIndex: -1,
      eventbus: this.eventbus,
    };
    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        this.startOperations,
        0,
        resolve,
        reject,
        initOperationData,
        context
      );
    }).catch(e => {
      console.error(`Error in action start '${this.name}'`);
      console.error(e);
      throw e;
    });
    return result;
  }

  executeOperation(
    operations: IResolvedOperation[],
    idx: number,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    previousOperationData: TOperationData | undefined = {},
    context: IOperationContext
  ): void {
    if (context.newIndex !== undefined) {
      idx = context.newIndex;
      delete context.newIndex;
    }

    context.currentIndex = idx;

    if (context.skipNextOperation) {
      if (idx < operations.length) {
        this.executeOperation(
          operations,
          ++idx,
          resolve,
          reject,
          previousOperationData,
          context
        );
      } else {
        resolve(previousOperationData);
      }
    }

    if (idx < operations.length) {
      const operationInfo = operations[idx];

      const copy = operationInfo.operationData
        ? deepCopy(operationInfo.operationData)
        : {};
      const mergedOperationData = Object.assign(previousOperationData, copy);

      const operationResult: TOperationResult = operationInfo.instance.call(
        context,
        mergedOperationData
      );

      if (isPromise(operationResult)) {
        operationResult
          .then((resultOperationData: TOperationData) => {
            this.executeOperation(
              operations,
              ++idx,
              resolve,
              reject,
              resultOperationData,
              context
            );
          })
          .catch((error: any) => {
            reject(error);
          });
      } else {
        this.executeOperation(
          operations,
          ++idx,
          resolve,
          reject,
          operationResult,
          context
        );
      }
    } else {
      resolve(previousOperationData);
    }
  }
}
