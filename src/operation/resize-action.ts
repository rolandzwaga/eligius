import { TOperation } from '../action/types';
import mergeOperationData from './helper/merge-operation-data';

export interface IResizeActionOperationData {
  actionInstance: any;
  actionOperationData: any;
}

const resizeAction: TOperation<IResizeActionOperationData> = function (operationData, _eventBus) {
  const { actionInstance, actionOperationData } = operationData;
  operationData = mergeOperationData(operationData, actionOperationData);
  if (actionInstance.resize) {
    return actionInstance.resize(operationData);
  }
  return operationData;
};

export default resizeAction;
