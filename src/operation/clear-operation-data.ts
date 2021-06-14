import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface IClearOperationDataOperationData {
  properties?: string[];
}

export const clearOperationData: TOperation<IClearOperationDataOperationData> = function(
  operationData: IClearOperationDataOperationData,
  _eventBus: IEventbus
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
