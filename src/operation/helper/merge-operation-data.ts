import type { TOperationData } from '../types.ts';

export function mergeOperationData<T extends TOperationData, K = T>(
  operationData: T,
  newOperationData: TOperationData
): K {
  return { ...(operationData as any), ...newOperationData } as K;
}
