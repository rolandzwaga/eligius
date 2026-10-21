import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';
import {isPromise} from '@util/guards/is-promise.ts';

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

  const result = func.apply(this, [operationData]);
  // The function's return value is ignored, but a promise is awaited. Only a real
  // thenable takes that path; a synchronous function may return anything.
  if (result !== null && isPromise(result)) {
    return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
      result.then(() => {
        internalResolve(resolve, {}, operationData);
      }, reject);
    });
  }

  return operationData;
};
