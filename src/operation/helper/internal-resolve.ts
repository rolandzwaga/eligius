import {mergeOperationData} from '@operation/helper/merge-operation-data.ts';
import type {TOperationData} from '@operation/types.ts';

export function internalResolve<T extends TOperationData = TOperationData>(
  resolve: (data: T | PromiseLike<T>) => void,
  operationData: TOperationData,
  newOperationData?: TOperationData
) {
  if (newOperationData) {
    resolve(mergeOperationData(operationData, newOperationData) as T);
  } else {
    resolve(operationData as T);
  }
}
