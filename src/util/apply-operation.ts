import type {
  ExtractOperationData,
  ExtractReturnedOperationData,
  IOperationScope,
  TOperation,
} from '../operation/index.ts';

export const defaultScope: IOperationScope = {
  currentIndex: -1,
  eventbus: {} as any,
  operations: []
};

export function applyOperation<
  T extends TOperation<any> = TOperation<any>,
  OD = ExtractOperationData<T>,
  RT = ExtractReturnedOperationData<T>,
>(
  operation: T,
  operationData: OD,
  scope: IOperationScope = defaultScope
): RT {
  return operation.apply(scope, [operationData]) as ReturnType<T>;
}
