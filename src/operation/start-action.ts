import type { IAction } from '../action/types.ts';
import { internalResolve } from './helper/internal-resolve.ts';
import { mergeOperationData } from './helper/merge-operation-data.ts';
import type { TOperation, TOperationData } from './types.ts';

export interface IStartActionOperationData {
  /**
   * @dependecy
   */
  actionInstance: IAction;
  /**
   * @type=ParameterType:object
   */
  actionOperationData: TOperationData;
}

/**
 * This operation starts the specified action instance using the given action operation data.
 *
 * The action operation data is first merged with the current operation data before it is
 * passed on to the action. After the action has completed the action operation data properties
 * are removed from the current operation data.
 */
export const startAction: TOperation<IStartActionOperationData> = function (
  operationData: IStartActionOperationData
) {
  let { actionInstance, actionOperationData, ...newOperationData } = operationData;

  return new Promise((resolve, reject) => {
    newOperationData = mergeOperationData(newOperationData, actionOperationData);

    actionInstance.start(newOperationData).then(() => {
      Object.keys(actionOperationData).forEach((key) => {
        delete (newOperationData as any)[key];
      });
      internalResolve(resolve, {...newOperationData, actionInstance});
    }, reject);
  });
};
