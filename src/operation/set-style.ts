import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ISetStyleOperationData {
  properties: any;
  propertyName?: string;
  selectedElement?: JQuery;
}

export const setStyle: TOperation<ISetStyleOperationData> = function(
  operationData: ISetStyleOperationData
) {
  const { propertyName = 'selectedElement' } = operationData;

  const properties = resolvePropertyValues(
    operationData,
    operationData.properties
  );
  (operationData as any)[propertyName].css(properties);
  delete operationData.propertyName;

  return operationData;
};
