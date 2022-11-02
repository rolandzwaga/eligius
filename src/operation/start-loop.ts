import { TOperation } from './types';

export type TStartLoopOperationData = {
  collection: any[] | string;
  currentItem: any;
};

/**
 * This operation starts a loop using the given collection.
 *
 * Each iteration the current item from the specified collection is
 * assigned to the `currentItem` property on the current operation data.
 *
 * @param operationData
 * @returns
 */
export const startLoop: TOperation<TStartLoopOperationData> = function (
  operationData: TStartLoopOperationData
) {
  const context = this;
  const { collection } = operationData;

  if (collection !== null && !Array.isArray(collection)) {
    throw new Error(
      'Expected collection to be array type, string value was probably not resolved correctly'
    );
  }

  // First iteration of the loop
  if (context.loopIndex === undefined) {
    if (collection?.length) {
      context.loopIndex = 0;
      context.loopLength = collection.length - 1;
      context.loopStartIndex = context.currentIndex;
    } else {
      context.skipNextOperation = true;
    }
  }

  if (collection?.length && context.loopIndex !== undefined) {
    operationData.currentItem = collection[context.loopIndex];
  }

  return operationData;
};
