import type {endForEach} from '@operation/end-for-each.ts';
import type {forEach} from '@operation/for-each.ts';
import {requestLoopJump} from '@operation/helper/loop-jump.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';

/**
 *
 * This operation should only be used within a loop, so between a {@link forEach} and {@link endForEach}
 * operation. This operation immediately moves to the loop end index, effectively stopping the loop.
 *
 * It can be placed inside a `when`/`otherwise`/`endWhen` block within the loop, to break conditionally.
 *
 * @category Control Flow
 */
export const breakForEach: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  requestLoopJump(this, 'break');
  return operationData;
};
