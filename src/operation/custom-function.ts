import {TimelineEventNames} from '../timeline-event-names.ts';
import {internalResolve} from './helper/internal-resolve.ts';
import type {TOperation} from './types.ts';

export interface ICustomFunctionOperationData {
  systemName: string;
}

/**
 * This operation retrieves a custom function defined by the given system name
 * and invokes it with the current operation data and eventbus.
 *
 * @param operationData
 * @returns
 */
export const customFunction: TOperation<ICustomFunctionOperationData> =
  function (operationData: ICustomFunctionOperationData) {
    const {systemName} = operationData;
    return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
      const resultCallback = (func: Function) => {
        const promise = func.apply(this, [operationData]);
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
