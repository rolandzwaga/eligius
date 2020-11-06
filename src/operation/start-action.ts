import { IAction, TOperation } from '../action/types';
import internalResolve from './helper/internal-resolve';
import mergeOperationData from './helper/merge-operation-data';

export interface IStartActionOperationData {
  actionInstance: IAction;
  actionOperationData: any;
}

const startAction: TOperation<IStartActionOperationData> = function (operationData, _eventBus) {
  const { actionInstance, actionOperationData } = operationData;
  return new Promise((resolve, reject) => {
    operationData = mergeOperationData(operationData, actionOperationData);
    actionInstance.start(operationData).then(() => {
      internalResolve(resolve, operationData);
    }, reject);
  });
};

export default startAction;
