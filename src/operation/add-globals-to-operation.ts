import {assertSafeGlobalName, getGlobals} from '@operation/helper/globals.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IAddGlobalsToOperationData {
  /**
   * The names of the global properties that will be copied onto the current operation data
   *
   * @required
   * @erased
   */
  globalProperties: string[];
}

/**
 * This operation adds the specified global property names to the current operation data.
 * It finally removes the `globalProperties` property from the current operation data.
 *
 * Plain data is copied, so changing it does not change the global store. jQuery objects, DOM
 * nodes, functions and class instances (such as controllers) are added by reference.
 *
 * @throws When a name is `__proto__`, `prototype` or `constructor`.
 *
 * @category Data
 */
export const addGlobalsToOperation: TOperation<
  IAddGlobalsToOperationData,
  Omit<IAddGlobalsToOperationData, 'globalProperties'>
> = (operationData: IAddGlobalsToOperationData) => {
  const {globalProperties} = operationData;

  const globalValues = globalProperties.reduce<Record<string, any>>(
    (prev, current) => {
      assertSafeGlobalName(current, 'addGlobalsToOperation');
      prev[current] = getGlobals(current);
      return prev;
    },
    {}
  );
  removeProperties(operationData, 'globalProperties');

  return Object.assign(operationData, globalValues);
};
