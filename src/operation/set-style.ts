import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ISetStyleOperationData {
  properties: any;
  propertyName?: string;
}

/**
 * This operation assigns the specified CSS style properties to the
 * specified selected element. The selected element is assigned to
 * the property defined by the propertyName property which defaults
 * to 'selectedElement'.
 *
 * @param operationData
 * @returns
 */
export const setStyle: TOperation<ISetStyleOperationData> = function (
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
