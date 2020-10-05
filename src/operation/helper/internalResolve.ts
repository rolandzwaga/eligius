import mergeOperationData from './mergeOperationData';
import { TOperationData } from '../../action/types';

function internalResolve(resolve: Function, operationData: TOperationData, newOperationData?: TOperationData) {
  if (newOperationData) {
    resolve(mergeOperationData(operationData, newOperationData));
  } else {
    resolve(operationData);
  }
}

export default internalResolve;
