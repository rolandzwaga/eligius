import { TOperation } from './types';

export interface IClearOperationDataOperationData {
  properties?: string[];
}

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
