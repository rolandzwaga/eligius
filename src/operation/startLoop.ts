import { TOperation, IOperationContext } from '../action/types';

export interface IStartLoopOperationData {
  collection: any[];
  propertyName?: string;
}

const startLoop: TOperation<IStartLoopOperationData> = function (this: IOperationContext, operationData, _eventBus) {
  const context = this;
  const { collection } = operationData;
  let { propertyName } = operationData;
  propertyName = propertyName || 'currentItem';
  if (!context.loopIndex) {
    if (collection && collection.length) {
      context.loopIndex = 0;
      context.loopLength = collection.length - 1;
      context.startIndex = context.currentIndex;
    } else {
      context.skip = true;
    }
  }
  if (collection && collection.length) {
    (operationData as any)[propertyName] = collection[context.loopIndex];
  }
  return operationData;
};

export default startLoop;
