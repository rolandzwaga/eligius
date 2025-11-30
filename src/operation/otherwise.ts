import {findMatchingOperationIndex} from '@operation/helper/find-matching-operation-index.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

/**
 * If the preceeding {@link when} operation evaluates to `true` subsequent operations will
 * be skipped until an {@link endWhen} operation is encountered.
 *
 * @category Control Flow
 */
export const otherwise: TOperation<Record<string, unknown>> = function (
  operationData: Record<string, unknown>
) {
  if (this.whenEvaluation) {
    this.newIndex = findEndWhenIndex(this);
  }
  return operationData;
};

function findEndWhenIndex(scope: IOperationScope) {
  const currentIndex = scope.currentIndex + 1;
  const list = scope.operations.slice(currentIndex);

  const endWhenIndex = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: 'when',
      matchingName: 'endWhen',
    })
  );

  return endWhenIndex > -1
    ? endWhenIndex + currentIndex
    : scope.operations.length;
}
