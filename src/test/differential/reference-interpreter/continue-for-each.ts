// PINNED COPY of src/operation/continue-for-each.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {TOperation, TOperationData} from '@operation/types.ts';
import type {endForEach} from './end-for-each.ts';
import type {forEach} from './for-each.ts';
import {requestLoopJump} from './helper/loop-jump.ts';

/**
 *
 * This operation should only be used within a loop, so between a {@link forEach} and {@link endForEach}
 * operation. This operation immediately moves to the next loop index, effectively canceling the rest
 * of the operations in the current iteration.
 *
 * It can be placed inside a `when`/`otherwise`/`endWhen` block within the loop, to continue conditionally.
 *
 * @category Control Flow
 */
export const continueForEach: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  requestLoopJump(this, 'continue');
  return operationData;
};
