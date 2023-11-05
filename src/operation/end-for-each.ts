import { TOperation, TOperationData } from './types';

/**
 * This operation checks if the current loop should end or start the next iteration.
 *
 * @param operationData
 * @returns
 */
export const endForEach: TOperation<TOperationData> = function (operationData: TOperationData) {
  if (this.loopIndex !== undefined && this.loopLength !== undefined && this.loopIndex < this.loopLength) {
    this.loopIndex = this.loopIndex + 1;
    this.newIndex = this.loopStartIndex;
    delete this.currentItem;
  }

  return operationData;
};
