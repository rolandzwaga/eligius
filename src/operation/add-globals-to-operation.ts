import {getGlobals} from './helper/globals.ts';
import type {TOperation} from './types.ts';

export interface IAddGlobalsToOperationData {
  /**
   * @required
   */
  globalProperties: string[];
}

/**
 * This operation adds the specified global property names to the current operation data.
 * It finally removes the `globalProperties` property from the current operation data.
 */
export const addGlobalsToOperation: TOperation<IAddGlobalsToOperationData> = (
  operationData: IAddGlobalsToOperationData
) => {
  const {globalProperties} = operationData;

  const globalValues = globalProperties.reduce<Record<string, any>>(
    (prev, current) => {
      prev[current] = getGlobals(current);
      return prev;
    },
    {}
  );
  delete (operationData as any).globalProperties;

  return Object.assign(operationData, globalValues);
};
