import { findMatchingOperationIndex } from './helper/find-matching-operation-index';
import { IOperationContext, TOperation } from './types';

export const otherwise: TOperation<{}> = function (operationData: {}) {
  if (this.whenEvaluation) {
    this.newIndex = findEndWhenIndex(this);
  }
  return operationData;
};

function findEndWhenIndex(context: IOperationContext) {
  const list = context.operations.slice(context.currentIndex);

  const endWhenIndex = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: 'when',
      matchingName: 'endWhen',
    })
  );

  return endWhenIndex > -1
    ? endWhenIndex + (context.currentIndex + 1)
    : context.operations.length;
}
