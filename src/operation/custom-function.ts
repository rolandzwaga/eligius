import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {requestRegisteredEntry} from '@operation/helper/request-registered-entry.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';
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
 * `EngineFactory` answers from its resource importer. Register the function
 * with the `EligiusResourceImporter` constructor:
 * `new EligiusResourceImporter({functions: {myFunction}})`.
 *
 * The function is called with the current operation data as its argument, and with `this`
 * set to a view of the operation scope. Reading a property from `this` returns it from the
 * innermost scope that has it, so inside a `when` block in a loop `this.currentItem`,
 * `this.loopIndex` and `this.variables` return the loop's and the action's values, the same
 * as `$scope.` chains. Assigning to `this` (for example `this.newIndex`) writes to the scope the
 * operation runs in.
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

  const result = func.apply(createScopeView(this), [operationData]);
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

/**
 * Returns a view of `scope` whose reads fall through to the parent scopes for properties the
 * scope itself does not have (the same rule `$scope.` chains use). Writes and deletes go to
 * `scope` itself.
 */
function createScopeView(scope: IOperationScope): IOperationScope {
  if (!scope?.parent) {
    return scope;
  }
  return new Proxy(scope, {
    get(target, property) {
      let current: IOperationScope | undefined = target;
      while (current) {
        if (property in current) {
          return Reflect.get(current, property, current);
        }
        current = current.parent;
      }
      return undefined;
    },
    has(target, property) {
      let current: IOperationScope | undefined = target;
      while (current) {
        if (property in current) {
          return true;
        }
        current = current.parent;
      }
      return false;
    },
  });
}
