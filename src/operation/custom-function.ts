import { TimelineEventNames } from '../timeline-event-names';
import { internalResolve } from './helper/internal-resolve';
import { TOperation } from './types';

export interface ICustomFunctionOperationData {
  systemName: string;
}

/**
 * This operation retrieves a custom function defined by the specified system name
 * and invokes it with the current operation data and eventbus.
 *
 * @param operationData
 * @returns
 */
export const customFunction: TOperation<ICustomFunctionOperationData> =
  function (operationData: ICustomFunctionOperationData) {
    const { systemName } = operationData;
    return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
      const resultCallback = (func: Function) => {
        const promise = func(operationData, this.eventbus);
        if (promise) {
          promise.then(() => {
            internalResolve(resolve, {}, operationData);
          }, reject);
        } else {
          internalResolve(resolve, {}, operationData);
        }
      };
      this.eventbus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [
        systemName,
        resultCallback,
      ]);
    });
  };
