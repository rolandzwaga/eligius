import { IEventbus } from '../eventbus/types';
import { IOperationContext, TOperation } from './types';

export const endLoop: TOperation<never> = function (
  this: IOperationContext,
  operationData: never,
  _eventBus: IEventbus
) {
  const context = this;

  if (!context.skip) {
    if (context.loopIndex !== undefined && context.loopLength !== undefined && context.loopIndex < context.loopLength) {
      context.loopIndex = context.loopIndex + 1;
      context.newIndex = context.startIndex;
    } else {
      delete context.loopIndex;
      delete context.loopLength;
      delete context.startIndex;
      delete context.newIndex;
    }
  } else {
    delete context.skip;
  }

  return operationData;
};
