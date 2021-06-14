import { IAction } from '../action/types';
import { IEventbus } from '../eventbus/types';
import { internalResolve } from './helper/internal-resolve';
import { mergeOperationData } from './helper/merge-operation-data';
import { TOperation } from './types';

export interface IStartActionOperationData {
  actionInstance: IAction;
  actionOperationData: any;
}

export const startAction: TOperation<IStartActionOperationData> = function(
  operationData: IStartActionOperationData,
  _eventBus: IEventbus
) {
  const { actionInstance, actionOperationData } = operationData;
  delete operationData.actionOperationData;

  return new Promise((resolve, reject) => {
    operationData = mergeOperationData(operationData, actionOperationData);

    actionInstance.start(operationData).then(() => {
      Object.keys(actionOperationData).forEach(key => {
        delete (operationData as any)[key];
      });
      internalResolve(resolve, operationData);
    }, reject);
  });
};
