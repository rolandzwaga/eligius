import { TOperation } from './types';

export interface IRemovePropertiesFromOperationDataOperationData {
  propertyNames: string[];
}

export const removePropertiesFromOperationData: TOperation<IRemovePropertiesFromOperationDataOperationData> = function(
  operationData: IRemovePropertiesFromOperationDataOperationData
) {
  const { propertyNames } = operationData;

  propertyNames.forEach(name => {
    delete (operationData as any)[name];
  });
  delete (operationData as any).propertyNames;
  return operationData;
};
