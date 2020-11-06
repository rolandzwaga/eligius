import { TOperationData } from '../../action/types';
import mergeOperationData from './merge-operation-data';

function internalResolve(resolve: Function, operationData: TOperationData, newOperationData?: TOperationData) {
  if (newOperationData) {
    resolve(mergeOperationData(operationData, newOperationData));
  } else {
    resolve(operationData);
  }
}

export default internalResolve;
