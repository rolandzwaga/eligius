import mergeOperationData from './helper/mergeOperationData';
import internalResolve from './helper/internalResolve';
import { IAction, TOperation } from '../action/types';

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
