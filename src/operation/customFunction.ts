import internalResolve from './helper/internalResolve';
import TimelineEventNames from '../timeline-event-names';
import { TOperation } from '../action/types';

export interface ICustomFunctionOperationData {
  systemName: string;
}

const customFunction: TOperation<ICustomFunctionOperationData> = function (operationData, eventBus) {
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
    eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [systemName, resultCallback]);
  });
};

export default customFunction;
