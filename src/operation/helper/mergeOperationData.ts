import { TOperationData } from '../../action/types';

function mergeOperationData(operationData: TOperationData, newOperationData: TOperationData): TOperationData {
  return Object.assign(operationData, newOperationData);
}

export default mergeOperationData;
