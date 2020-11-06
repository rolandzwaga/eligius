import { TOperation } from '../action/types';

export interface IClearOperationDataOperationData {
  properties?: string[];
}

const clearOperationData: TOperation<IClearOperationDataOperationData> = function (operationData, _eventBus) {
  const { properties } = operationData;
  if (properties) {
    properties.forEach((name) => {
      delete (operationData as any)[name];
    });
    delete operationData.properties;
    return operationData;
  }
  return {};
};

export default clearOperationData;
