import { IEndableAction } from '../action/types';
import { internalResolve } from './helper/internal-resolve';
import { mergeOperationData } from './helper/merge-operation-data';
import { TOperation } from './types';

export interface IEndActionOperationData {
  actionInstance: IEndableAction;
  actionOperationData: any;
}

export const endAction: TOperation<IEndActionOperationData> = function(
  operationData: IEndActionOperationData
) {
  const { actionInstance, actionOperationData } = operationData;
  delete operationData.actionOperationData;

  return new Promise<IEndActionOperationData>((resolve, reject) => {
    operationData = mergeOperationData(operationData, actionOperationData);

    actionInstance.end(operationData).then(() => {
      Object.keys(actionOperationData).forEach(key => {
        delete (operationData as any)[key];
      });
      internalResolve(resolve, operationData);
    }, reject);
  });
};
