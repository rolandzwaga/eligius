import { TOperationData } from '~/operation/types';
export declare function mergeOperationData<T extends TOperationData, K = T>(operationData: T, newOperationData: TOperationData): K;
