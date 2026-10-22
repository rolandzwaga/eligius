import type {endForEach} from '@operation/end-for-each.ts';
import type {forEach} from '@operation/for-each.ts';
import {requestLoopJump} from '@operation/helper/loop-jump.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';

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
