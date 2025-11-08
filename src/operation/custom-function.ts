import {internalResolve} from './helper/internal-resolve.ts';
import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface ICustomFunctionOperationData {
  /**
   * @type=ParameterType:systemName
   * @erased
   * @required
   */
  systemName: string;
}

/**
 * This operation retrieves a custom function defined by the given system name
 * and invokes it with the current operation data and eventbus.
 *
 * @param operationData
 *
 * @category Utility
 */
export const customFunction: TOperation<
  ICustomFunctionOperationData,
  Omit<ICustomFunctionOperationData, 'systemName'>
> = function (operationData: ICustomFunctionOperationData) {
  const {systemName} = operationData;

  removeProperties(operationData, 'systemName');

  return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
    const resultCallback = (func: TOperation) => {
      const promise = func.apply(this, [operationData]);
      if (promise) {
        promise.then(() => {
          internalResolve(resolve, {}, operationData);
        }, reject);
      } else {
        internalResolve(resolve, {}, operationData);
      }
    };
    this.eventbus.broadcast('request-function', [
      systemName,
      resultCallback,
    ]);
  });
};
