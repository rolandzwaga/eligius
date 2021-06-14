import { IOperationContext, TOperation } from '../../../operation';

const defaultContext: IOperationContext = {
  currentIndex: -1,
  eventbus: {} as any,
};

export function applyOperation(
  operation: TOperation<any>,
  operationData: any,
  context: IOperationContext = defaultContext
) {
  return operation.apply(context, [operationData]);
}
