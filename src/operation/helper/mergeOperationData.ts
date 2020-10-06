import { TOperationData } from '../../action/types';

function mergeOperationData<T extends TOperationData, K = T>(operationData: T, newOperationData: TOperationData): K {
  return Object.assign(operationData, newOperationData) as K;
}

export default mergeOperationData;
