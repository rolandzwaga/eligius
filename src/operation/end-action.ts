import { IEndableAction, TOperation } from '../action/types';
import internalResolve from './helper/internal-resolve';
import mergeOperationData from './helper/merge-operation-data';

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
