import {setGlobals} from '@operation/helper/globals.ts';
import type {TOperation} from '@operation/types.ts';

export interface ISetGlobalDataOperationData {
  /**
   * @required
   * @erased
   */
  propertyNames: string[];
}

/**
 * This operation copies the specified properties from the operationData to the global data.
 *
 * Plain data is stored as a deep copy, so changing the operation data afterwards does not change
 * the global data. jQuery objects, DOM nodes, functions and class instances (such as controllers)
 * are stored by reference.
 *
 * @throws When a property name is `__proto__`, `prototype` or `constructor`.
 *
 * @category Data
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
