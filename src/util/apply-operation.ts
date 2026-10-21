import type {
  ExtractOperationData,
  ExtractReturnedOperationData,
  IOperationScope,
  TOperation,
} from '@operation/index.ts';

/**
 * Creates a fresh, minimal operation scope. Operations mutate their scope
 * (`whenEvaluation`, `variables`, loop bookkeeping), so every call gets its
 * own instance and no state leaks from one call to the next.
 *
 * @returns A new scope with no operations and a placeholder eventbus
 */
export function createDefaultScope(): IOperationScope {
  return {
    currentIndex: -1,
    eventbus: {} as IOperationScope['eventbus'],
    operations: [],
  };
}

/**
 * Runs a single operation with `this` bound to the given scope. Used by the
 * operation specs.
 *
 * @param operation - The operation to run
 * @param operationData - The operation data to pass in
 * @param scope - The operation scope; a fresh {@link createDefaultScope} scope
 * when omitted
 * @returns Whatever the operation returns
 */
export function applyOperation<
  T extends TOperation<any> = TOperation<any>,
  OD = ExtractOperationData<T>,
  RT = ExtractReturnedOperationData<T>,
>(
  operation: T,
  operationData: OD,
  scope: IOperationScope = createDefaultScope()
): RT {
  return operation.apply(scope, [operationData]) as ReturnType<T>;
}
