import type {endForEach} from './end-for-each.ts';
import type {forEach} from './for-each.ts';
import type {TOperation, TOperationData} from './types.ts';

/**
 *
 * This operation should only be used within a loop, so between a {@link forEach} and {@link endForEach}
 * operation. This operation immediately moves to the next loop index, effectively canceling the rest
 * of the operations in the current iteration.
 *
 * @category Control Flow
 */
export const continueForEach: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  if (this.loopIndex !== undefined && this.loopLength !== undefined) {
    this.newIndex = this.loopEndIndex;
    delete this.currentItem;
  }
  return operationData;
};
