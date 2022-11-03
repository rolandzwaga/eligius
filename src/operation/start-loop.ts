import { findMatchingOperationIndex } from './helper/find-matching-operation-index';
import { IOperationContext, TOperation } from './types';

export type TStartLoopOperationData = {
  collection: any[] | string;
};

/**
 * This operation starts a loop using the given collection.
 *
 * Each iteration the current item from the specified collection is
 * assigned to the `currentItem` property on the operation context.
 *
 * @param operationData
 * @returns
 */
export const startLoop: TOperation<TStartLoopOperationData> = function (
  operationData: TStartLoopOperationData
) {
  const { collection } = operationData;

  if (collection !== null && !Array.isArray(collection)) {
    throw new Error(
      'Expected collection to be array type, string value was probably not resolved correctly'
    );
  }

  // First iteration of the loop
  if (this.loopIndex === undefined) {
    this.loopEndIndex = findLoopEndIndex(this);
    if (collection?.length) {
      this.loopIndex = 0;
      this.loopLength = collection.length - 1;
      this.loopStartIndex = this.currentIndex;
    } else {
      this.newIndex = this.loopEndIndex;

      delete this.loopIndex;
      delete this.loopLength;
      delete this.loopStartIndex;
      delete this.loopEndIndex;
    }
  }

  if (collection?.length && this.loopIndex !== undefined) {
    this.currentItem = collection[this.loopIndex];
  }

  return operationData;
};

function findLoopEndIndex(context: IOperationContext) {
  const list = context.operations.slice(context.currentIndex + 1);

  const index = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: 'startLoop',
      matchingName: 'endLoop',
    })
  );
  const endLoopIndex =
    index > -1 ? index + (context.currentIndex + 1) : context.operations.length;

  return endLoopIndex;
}
