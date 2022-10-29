import { TOperation } from './types';

export interface IRemovePropertiesFromOperationDataOperationData {
  propertyNames: string[];
}

/**
 * This operation removes the given list of properties from the current operation data.
 * It will also omit the property 'propertyNames' from the result.
 *
 * @param operationData
 * @returns
 */
export const removePropertiesFromOperationData: TOperation<IRemovePropertiesFromOperationDataOperationData> =
  function (operationData: IRemovePropertiesFromOperationDataOperationData) {
    const { propertyNames } = operationData;
    if (propertyNames.indexOf('propertyNames') < 0) {
      propertyNames.push('propertyNames');
    }

    return Object.fromEntries(
      Object.entries(operationData).filter(
        ([name, _value]) => !propertyNames.includes(name)
      )
    ) as any;
  };
