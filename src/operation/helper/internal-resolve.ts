import type { TOperationData } from '../types.ts';
import { mergeOperationData } from './merge-operation-data.ts';

export function internalResolve(
  resolve: Function,
  operationData: TOperationData,
  newOperationData?: TOperationData
) {
  if (newOperationData) {
    resolve(mergeOperationData(operationData, newOperationData));
  } else {
    resolve(operationData);
  }
}
