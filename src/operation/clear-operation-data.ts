import type { TOperation } from './types.ts';

export interface IClearOperationDataOperationData {
  properties?: string[];
}

/**
 * This operation removes all of the properties on the current operation date.
 * Or, if the `properties` property is set only removes the properties defined by that list.
 * 
 */
export const clearOperationData: TOperation<IClearOperationDataOperationData> = function(
  operationData: IClearOperationDataOperationData
) {
  const { properties } = operationData;

  if (properties) {
    properties.forEach(name => {
      delete (operationData as any)[name];
    });
    delete operationData.properties;
    return operationData;
  }

  return {};
};
