import { getGlobals } from './helper/globals';
import { TOperation } from './types';

export interface IAddGlobalsToOperationData {
  globalProperties: string[];
}

/**
 * This operation adds the specified global property names to the current operation data.
 * It finally removes the `globalProperties` property from the current operation data.
 *
 * @param operationData
 * @returns
 */
export const addGlobalsToOperation: TOperation<IAddGlobalsToOperationData> =
  function (operationData: IAddGlobalsToOperationData) {
    const { globalProperties } = operationData;

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
