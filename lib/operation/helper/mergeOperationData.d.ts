import { TOperationData } from '../../action/types';
declare function mergeOperationData<T extends TOperationData, K = T>(operationData: T, newOperationData: TOperationData): K;
export default mergeOperationData;
