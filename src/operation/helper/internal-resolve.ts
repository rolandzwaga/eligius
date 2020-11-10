import { TOperationData } from '../types';
import { mergeOperationData } from './merge-operation-data';

export function internalResolve(resolve: Function, operationData: TOperationData, newOperationData?: TOperationData) {
  if (newOperationData) {
    resolve(mergeOperationData(operationData, newOperationData));
  } else {
    resolve(operationData);
  }
}
