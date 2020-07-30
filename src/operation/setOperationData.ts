import resolvePropertyValues from './helper/resolvePropertyValues';
import { TOperation } from '../action/types';

export interface ISetOperationData {
  override: boolean;
  properties: any;
}

const setOperationData: TOperation<ISetOperationData> = function (operationData, _eventBus) {
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

export default setOperationData;