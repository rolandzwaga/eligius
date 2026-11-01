import {findMatchingEndIndex} from '@operation/helper/flow-control-index.ts';
import {
  endWhenSystemName,
  whenSystemName,
} from '@operation/helper/flow-control-names.ts';
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
  const endWhenIndex = findMatchingEndIndex(
    scope.operations,
    scope.currentIndex + 1,
    whenSystemName,
    endWhenSystemName
  );
  return endWhenIndex > -1 ? endWhenIndex : scope.operations.length;
}
