import type {IAction} from '@action/types.ts';
import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {mergeOperationData} from '@operation/helper/merge-operation-data.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';

export interface IStartActionOperationData {
  /**
   * @dependency
   */
  actionInstance: IAction;
  /**
   * @type=ParameterType:object
   * @erased
   */
  actionOperationData?: TOperationData;
}

/**
 * This operation starts the specified action instance using the given action operation data.
 *
 * The action receives its own copy of the current operation data merged with the action
 * operation data. Whatever the action's operations add, change or remove in that copy stays
 * with the action: once it has completed, this operation continues with the operation data it
 * had before, plus `actionInstance`, without the `actionOperationData` property.
 *
 * @category Action
 */
export const startAction: TOperation<
  IStartActionOperationData,
  Omit<IStartActionOperationData, 'actionOperationData'>
> = (operationData: IStartActionOperationData) => {
  const {
    actionInstance,
    actionOperationData = {},
    ...callerOperationData
  } = operationData;

  return new Promise((resolve, reject) => {
    if (!actionInstance) {
      reject(new Error('startAction: actionInstance is required'));
      return;
    }

    // The catch also rejects on errors thrown by the fulfilment handler, so the
    // returned promise always settles.
    actionInstance
      .start(mergeOperationData(callerOperationData, actionOperationData))
      .then(() => {
        internalResolve(resolve, {...callerOperationData, actionInstance});
      })
      .catch(reject);
  });
};
