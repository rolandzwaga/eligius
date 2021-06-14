import { IEventbus } from '../eventbus/types';
import { TimelineEventNames } from '../index';
import { internalResolve } from './helper/internal-resolve';
import { TOperation } from './types';

export interface ICustomFunctionOperationData {
  systemName: string;
}

export const customFunction: TOperation<ICustomFunctionOperationData> = function(
  operationData: ICustomFunctionOperationData,
  eventBus: IEventbus
) {
  const { systemName } = operationData;
  return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
    const resultCallback = (func: Function) => {
      const promise = func(operationData, eventBus);
      if (promise) {
        promise.then(() => {
          internalResolve(resolve, {}, operationData);
        }, reject);
      } else {
        internalResolve(resolve, {}, operationData);
      }
    };
    eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [
      systemName,
      resultCallback,
    ]);
  });
};
