import type {TOperationData} from '../types.ts';
import {mergeOperationData} from './merge-operation-data.ts';

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
