import { TOperationData } from '../types';

export function mergeOperationData<T extends TOperationData, K = T>(
  operationData: T,
  newOperationData: TOperationData
): K {
  return Object.assign(operationData, newOperationData) as K;
}
