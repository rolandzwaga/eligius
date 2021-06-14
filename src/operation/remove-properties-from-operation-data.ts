import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface IRemovePropertiesFromOperationDataOperationData {
  propertyNames: string[];
}

export const removePropertiesFromOperationData: TOperation<IRemovePropertiesFromOperationDataOperationData> = function(
  operationData: IRemovePropertiesFromOperationDataOperationData,
  _eventBus: IEventbus
) {
  const { propertyNames } = operationData;

  propertyNames.forEach(name => {
    delete (operationData as any)[name];
  });
  delete (operationData as any).propertyNames;
  return operationData;
};
