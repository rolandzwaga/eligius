import { IEventbus } from '~/eventbus/types';
import { IOperationContext, TOperation } from './types';

export interface IStartLoopOperationData {
  collection: any[];
  propertyName?: string;
}

export const startLoop: TOperation<IStartLoopOperationData> = function (
  this: IOperationContext,
  operationData: IStartLoopOperationData,
  _eventBus: IEventbus
) {
  const context = this;
  const { collection, propertyName = 'currentItem' } = operationData;

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

  return operationData;
};
