import resolvePropertyValues from './helper/resolvePropertyValues';
import { TOperation } from '../action/types';

export interface ISetStyleOperationData {
  properties: any;
  propertyName?: string;
}

const setStyle: TOperation<ISetStyleOperationData> = function (operationData, _eventBus) {
  let { propertyName } = operationData;
  if (!propertyName) {
    propertyName = 'selectedElement';
  }
  const properties = resolvePropertyValues(operationData, operationData.properties);
  (operationData as any)[propertyName].css(properties);
  return operationData;
};

export default setStyle;
