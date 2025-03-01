import type { ExtractOperationData, IOperationContext, TOperation } from '../operation/index.ts';

export const defaultContext: IOperationContext = {
  currentIndex: -1,
  eventbus: {} as any,
  operations: [],
};

export function applyOperation<T extends TOperation<any>=TOperation<any>, OD = ExtractOperationData<T>>(
  operation: T,
  operationData: OD,
  context: IOperationContext = defaultContext
): ReturnType<T> {
  return operation.apply(context, [operationData]) as ReturnType<T>;
}
