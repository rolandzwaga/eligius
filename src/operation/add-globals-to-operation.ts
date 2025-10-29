import {getGlobals} from './helper/globals.ts';
import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

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
 * @category Data
 */
export const addGlobalsToOperation: TOperation<
  IAddGlobalsToOperationData,
  Omit<IAddGlobalsToOperationData, 'globalProperties'>
> = (operationData: IAddGlobalsToOperationData) => {
  const {globalProperties} = operationData;

  const globalValues = globalProperties.reduce<Record<string, any>>(
    (prev, current) => {
      prev[current] = getGlobals(current);
      return prev;
    },
    {}
  );
  removeProperties(operationData, 'globalProperties');

  return Object.assign(operationData, globalValues);
};
