import type {
  ExtractOperationData,
  ExtractReturnedOperationData,
  IOperationContext,
  TOperation,
} from '../operation/index.ts';

export const defaultContext: IOperationContext = {
  currentIndex: -1,
  eventbus: {} as any,
  operations: [],
};

export function applyOperation<
  T extends TOperation<any> = TOperation<any>,
  OD = ExtractOperationData<T>,
  RT = ExtractReturnedOperationData<T>,
>(
  operation: T,
  operationData: OD,
  context: IOperationContext = defaultContext
): RT {
  return operation.apply(context, [operationData]) as ReturnType<T>;
}
