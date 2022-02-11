import { TOperation } from './types';

export interface IRemovePropertiesFromOperationDataOperationData {
  propertyNames: string[];
}

/**
 * This operation removes the given list of properties from the current operation data.
 *
 * @param operationData
 * @returns
 */
export const removePropertiesFromOperationData: TOperation<IRemovePropertiesFromOperationDataOperationData> =
  function (operationData: IRemovePropertiesFromOperationDataOperationData) {
    const { propertyNames } = operationData;

    propertyNames.forEach((name) => {
      delete (operationData as any)[name];
    });
    delete (operationData as any).propertyNames;
    return operationData;
  };
