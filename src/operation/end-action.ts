import { IEndableAction } from '../action/types';
import { IEventbus } from '../eventbus/types';
import { internalResolve } from './helper/internal-resolve';
import { mergeOperationData } from './helper/merge-operation-data';
import { TOperation } from './types';

export interface IEndActionOperationData {
  actionInstance: IEndableAction;
  actionOperationData: any;
}

export const endAction: TOperation<IEndActionOperationData> = function (
  operationData: IEndActionOperationData,
  _eventBus: IEventbus
) {
  const { actionInstance, actionOperationData } = operationData;
  delete operationData.actionOperationData;
  return new Promise<IEndActionOperationData>((resolve, reject) => {
    const mergedData = mergeOperationData(operationData, actionOperationData);
    actionInstance.end(mergedData).then(() => {
      internalResolve(resolve, operationData);
    }, reject);
  });
};
