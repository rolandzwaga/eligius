import {setGlobals} from './helper/globals.ts';
import type {TOperation} from './types.ts';

export interface ISetGlobalDataOperationData {
  /**
   * @required
   */
  propertyNames: string[];
}

/**
 * This operation copies the specified properties from the operationData to the global data.
 */
export const setGlobalData: TOperation<
  ISetGlobalDataOperationData,
  Omit<ISetGlobalDataOperationData, 'propertyNames'>
> = (operationData: ISetGlobalDataOperationData) => {
  const {propertyNames, ...newOperationData} = operationData;
  const newGlobals = Object.fromEntries(
    Object.entries(operationData).filter(([name, _value]) =>
      propertyNames.includes(name)
    )
  );

  setGlobals(newGlobals);

  return newOperationData;
};
