import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {requestRegisteredEntry} from '@operation/helper/request-registered-entry.ts';
import type {TOperation} from '@operation/types.ts';
import {isFunction} from '@util/guards/is-function.ts';
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
 * The function is looked up with the `request-function` event, which the
 * `EngineFactory` answers from its resource importer. The default
 * `EligiusResourceImporter` only provides Eligius' own exports, so custom
 * functions need a custom resource importer.
 *
 * @param operationData
 * @throws Error naming the operation and the `systemName` when nothing is
 * registered under that name (with the closest registered names when the
 * importer can suggest them), or when the registered value is not a function.
 *
 * @category Utility
 */
export const customFunction: TOperation<
  ICustomFunctionOperationData,
  Omit<ICustomFunctionOperationData, 'systemName'>
> = function (operationData: ICustomFunctionOperationData) {
  const {systemName} = operationData;

  removeProperties(operationData, 'systemName');

  const func = requestRegisteredEntry(
    this.eventbus,
    'customFunction',
    systemName,
    'function'
  );

  if (!isFunction(func)) {
    throw new Error(
      `customFunction: systemName '${systemName}' does not resolve to a function.`
    );
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
