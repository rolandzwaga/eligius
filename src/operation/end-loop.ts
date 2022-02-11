import { TOperationData } from '.';
import { TOperation } from './types';

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
