// PINNED COPY of src/operation/end-for-each.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {TOperation, TOperationData} from '@operation/types.ts';
import {clearLoopCollection} from './for-each.ts';

/**
 * This operation checks if the current loop should end or start the next iteration.
 *
 * @category Control Flow
 */
export const endForEach: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  if (
    this.loopIndex !== undefined &&
    this.loopLength !== undefined &&
    this.loopIndex < this.loopLength
  ) {
    this.loopIndex = this.loopIndex + 1;
    this.newIndex = this.loopStartIndex;
    delete this.currentItem;
  } else {
    clearLoopCollection(this);
  }

  return operationData;
};
