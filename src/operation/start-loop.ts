import { TOperation } from './types';

export type TStartLoopOperationData = {
  collection: any[] | string;
  propertyName?: string;
};

export const startLoop: TOperation<TStartLoopOperationData> = function(
  operationData: TStartLoopOperationData
) {
  const context = this;
  const { collection, propertyName = 'currentItem' } = operationData;

  if (typeof collection === 'string') {
    throw new Error(
      'Expected collection to be array type, string value was probably not resolved correctly'
    );
  }

  if (context.loopIndex === undefined) {
    if (collection?.length) {
      context.loopIndex = 0;
      context.loopLength = collection.length - 1;
      context.startIndex = context.currentIndex;
    } else {
      context.skipNextOperation = true;
    }
  }

  if (collection?.length && context.loopIndex !== undefined) {
    (operationData as any)[propertyName] = collection[context.loopIndex];
  }

  delete operationData.propertyName;

  return operationData;
};
