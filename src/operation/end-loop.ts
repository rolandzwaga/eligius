import { TOperationData } from '.';
import { TOperation } from './types';

/**
 * This operation checks if the current loop should end or start the next iteration.
 *
 * @param operationData
 * @returns
 */
export const endLoop: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  const context = this;

  if (!context.skipNextOperation) {
    if (
      context.loopIndex !== undefined &&
      context.loopLength !== undefined &&
      context.loopIndex < context.loopLength
    ) {
      context.loopIndex = context.loopIndex + 1;
      context.newIndex = context.startIndex;
    } else {
      delete context.loopIndex;
      delete context.loopLength;
      delete context.startIndex;
      delete context.newIndex;
    }
  } else {
    delete context.skipNextOperation;
  }

  return operationData;
};
