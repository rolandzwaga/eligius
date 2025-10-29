import type {TOperation} from './types.ts';

export interface IRemovePropertiesFromOperationDataOperationData {
  /**
   * @required
   * @erased
   */
  propertyNames: string[];
}

/**
 * This operation removes the given list of properties from the current operation data.
 * It will also remove the property `propertyNames` from the result.
 *
 * @category Data
 */
export const removePropertiesFromOperationData: TOperation<
  IRemovePropertiesFromOperationDataOperationData,
  Omit<IRemovePropertiesFromOperationDataOperationData, 'propertyNames'>
> = (operationData: IRemovePropertiesFromOperationDataOperationData) => {
  const {propertyNames} = operationData;
  if (propertyNames.indexOf('propertyNames') < 0) {
    propertyNames.push('propertyNames');
  }

  return Object.fromEntries(
    Object.entries(operationData).filter(
      ([name, _value]) => !propertyNames.includes(name)
    )
  );
};
