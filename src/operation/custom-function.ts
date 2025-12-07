import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

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

  const func = this.eventbus.request<TOperation>(
    'request-function',
    systemName
  );

  if (!func) {
    return operationData;
  }

  const promise = func.apply(this, [operationData]);
  if (promise) {
    return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
      promise.then(() => {
        internalResolve(resolve, {}, operationData);
      }, reject);
    });
  }

  return operationData;
};
