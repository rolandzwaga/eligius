import { IResolvedOperation } from '../configuration/types';
import { IOperationContext, TOperation } from './types';

export type TStartLoopOperationData = {
  collection: any[] | string;
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
    context.loopEndIndex = findLoopEndIndex(context);
    if (collection?.length) {
      context.loopIndex = 0;
      context.loopLength = collection.length - 1;
      context.loopStartIndex = context.currentIndex;
    } else {
      context.newIndex = context.loopEndIndex;

      delete context.loopIndex;
      delete context.loopLength;
      delete context.loopStartIndex;
      delete context.loopEndIndex;
    }
  }

  if (collection?.length && context.loopIndex !== undefined) {
    this.currentItem = collection[context.loopIndex];
  }

  return operationData;
};

function findLoopEndIndex(context: IOperationContext) {
  const list = context.operations.slice(context.currentIndex + 1);

  const index = list.findIndex(checkLoop.bind({ counter: 0 }));
  const endLoopIndex =
    index > -1 ? index + (context.currentIndex + 1) : context.operations.length;

  return endLoopIndex;
}

function checkLoop(this: { counter: number }, operation: IResolvedOperation) {
  if (operation.systemName === 'startLoop') {
    this.counter = this.counter + 1;
  }
  if (operation.systemName === 'endLoop' && this.counter === 0) {
    return true;
  }
  if (operation.systemName === 'endLoop' && this.counter > 0) {
    this.counter = this.counter - 1;
  }
  return false;
}
