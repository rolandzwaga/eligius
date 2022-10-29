import { setGlobals } from './helper/globals';
import { TOperation } from './types';

export interface ISetGlobalDataOperationData {
  properties: string[];
}

/**
 * This operation copies the specified values from the operationData to the global data.
 *
 * @param operationData
 * @returns
 */
export const setGlobalData: TOperation<ISetGlobalDataOperationData> = function (
  operationData: ISetGlobalDataOperationData
) {
  const { properties } = operationData;
  const newGlobals = Object.fromEntries(
    Object.entries(operationData).filter(([name, _value]) =>
      properties.includes(name)
    )
  );

  setGlobals(newGlobals);

  delete (operationData as any).properties;

  return operationData;
};
