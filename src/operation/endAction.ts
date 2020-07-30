import mergeOperationData from './helper/mergeOperationData';
import internalResolve from './helper/internalResolve';
import { IEndableAction, TOperation } from '../action/types';

export interface IEndActionOperationData {
  actionInstance: IEndableAction;
  actionOperationData: any;
}

const endAction: TOperation<IEndActionOperationData> = function (operationData, _eventBus) {
  const { actionInstance, actionOperationData } = operationData;
  delete operationData.actionOperationData;
  return new Promise<IEndActionOperationData>((resolve, reject) => {
    const mergedData = mergeOperationData(operationData, actionOperationData);
    actionInstance.end(mergedData).then(() => {
      internalResolve(resolve, operationData);
    }, reject);
  });
};

export default endAction;
