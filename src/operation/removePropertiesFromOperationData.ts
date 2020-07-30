import { TOperation } from '../action/types';

export interface IRemovePropertiesFromOperationDataOperationData {
  propertyNames: string[];
}

const removePropertiesFromOperationData: TOperation<IRemovePropertiesFromOperationDataOperationData> = function (
  operationData,
  _eventBus
) {
  const { propertyNames } = operationData;

  propertyNames.forEach((name) => {
    delete (operationData as any)[name];
  });
  delete operationData.propertyNames;
  return operationData;
};

export default removePropertiesFromOperationData;
