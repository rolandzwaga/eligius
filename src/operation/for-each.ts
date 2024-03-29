import { findMatchingOperationIndex } from './helper/find-matching-operation-index';
import { IOperationContext, TOperation } from './types';

export interface IForEachOperationData {
  collection: any[] | string;
}

/**
 * This operation iterates over the given collection.
 *
 * Each iteration the current item from the specified collection is
 * assigned to the {@link IOperationContext.currentItem} property on the operation context.
 *
 * At the start of the loop, the associated {@link endForEach} operation is determined and when
 * the last iteration is completed the flow control is set to the index of that operation.
 *
 * @param operationData
 * @returns
 */
export const forEach: TOperation<IForEachOperationData> = function (operationData: IForEachOperationData) {
  const { collection } = operationData;

  if (collection !== null && !Array.isArray(collection)) {
    throw new Error('Expected collection to be array type, string value was probably not resolved correctly');
  }

  // First iteration of the loop
  if (this.loopIndex === undefined) {
    this.loopEndIndex = findEndForEachIndex(this);
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

function findEndForEachIndex(context: IOperationContext) {
  const currentIndex = context.currentIndex + 1;
  const list = context.operations.slice(currentIndex);

  const index = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: forEachSystemName,
      matchingName: endForEachSystemName,
    })
  );
  const endLoopIndex = index > -1 ? index + currentIndex : context.operations.length;

  return endLoopIndex;
}

export const forEachSystemName = 'forEach';
export const endForEachSystemName = 'endForEach';