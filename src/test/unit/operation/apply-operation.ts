import { IOperationContext, TOperation } from '../../../operation';

export const defaultContext: IOperationContext = {
  currentIndex: -1,
  eventbus: {} as any,
};

export function applyOperation<T = TOperation>(
  operation: TOperation<any>,
  operationData: any,
  context: IOperationContext = defaultContext
) {
  return operation.apply(context, [operationData]) as T;
}
