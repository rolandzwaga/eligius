import type {endForEach} from '@operation/end-for-each.ts';
import type {forEach} from '@operation/for-each.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';

/**
 *
 * This operation should only be used within a loop, so between a {@link forEach} and {@link endForEach}
 * operation. This operation immediately moves to the loop end index, effectively stopping the loop.
 *
 * @category Control Flow
 */
export const breakForEach: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  if (this.loopIndex !== undefined && this.loopLength !== undefined) {
    this.newIndex = this.loopEndIndex;

    delete this.loopIndex;
    delete this.loopLength;
    delete this.loopStartIndex;
    delete this.loopEndIndex;
    delete this.currentItem;
  }
  return operationData;
};
