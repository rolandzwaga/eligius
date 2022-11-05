import { findMatchingOperationIndex } from './helper/find-matching-operation-index';
import { IOperationContext, TOperation } from './types';

/**
 * If the preceeding {@link when} operation evaluates to `true` subsequent operations will
 * be skipped until an {@link endWhen} operation is encountered.
 * 
 * @param operationData 
 * @returns 
 */
export const otherwise: TOperation<{}> = function (operationData: {}) {
  if (this.whenEvaluation) {
    this.newIndex = findEndWhenIndex(this);
  }
  return operationData;
};

function findEndWhenIndex(context: IOperationContext) {
  const currentIndex = context.currentIndex + 1;
  const list = context.operations.slice(currentIndex);

  const endWhenIndex = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: 'when',
      matchingName: 'endWhen',
    })
  );

  return endWhenIndex > -1
    ? endWhenIndex + currentIndex
    : context.operations.length;
}
