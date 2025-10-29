import type {TOperationData} from '../types.ts';

export function mergeOperationData<T extends TOperationData>(
  operationData: T,
  newOperationData: TOperationData
): T & TOperationData {
  return {...operationData, ...newOperationData};
}
