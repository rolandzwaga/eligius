import { IAction } from '../action/types';
import { internalResolve } from './helper/internal-resolve';
import { mergeOperationData } from './helper/merge-operation-data';
import { TOperation } from './types';

export interface IStartActionOperationData {
  actionInstance: IAction;
  actionOperationData: any;
}

/**
 * This operation starts the specified action instance using the given action operation data.
 *
 * The action operation data is first merged with the current operation data before it is
 * passed on to the action. After the action has completed the action operation data properties
 * are removed from the current operation data.
 *
 * @param operationData
 * @returns
 */
export const startAction: TOperation<IStartActionOperationData> = function (
  operationData: IStartActionOperationData
) {
  const { actionInstance, actionOperationData } = operationData;
  delete operationData.actionOperationData;

  return new Promise((resolve, reject) => {
    operationData = mergeOperationData(operationData, actionOperationData);

    actionInstance.start(operationData).then(() => {
      Object.keys(actionOperationData).forEach((key) => {
        delete (operationData as any)[key];
      });
      internalResolve(resolve, operationData);
    }, reject);
  });
};
