import { IEventbus } from '~/eventbus/types';
import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ISetOperationData {
  override: boolean;
  properties: any;
}

export const setOperationData: TOperation<ISetOperationData> = function (
  operationData: ISetOperationData,
  _eventBus: IEventbus
) {
  const { override, properties } = operationData;
  const resolvedProperties = resolvePropertyValues(operationData, properties);
  delete operationData.properties;

  if (override) {
    operationData = resolvedProperties;
  } else {
    operationData = Object.assign(operationData, resolvedProperties);
  }

  return operationData;
};
