// PINNED COPY of src/operation/otherwise.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {IOperationScope, TOperation} from '@operation/types.ts';
import {findMatchingOperationIndex} from './helper/find-matching-operation-index.ts';

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
