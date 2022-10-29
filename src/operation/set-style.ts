import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ISetStyleOperationData {
  properties: Record<string, unknown>;
  selectedElement: JQuery;
}

/**
 * This operation assigns the specified CSS style properties to the
 * specified selected element. The selected element is assigned to
 * the `selectedElement` property.
 *
 * @param operationData
 * @returns
 */
export const setStyle: TOperation<ISetStyleOperationData> = function (
  operationData: ISetStyleOperationData
) {
  const properties = resolvePropertyValues(
    operationData,
    operationData.properties
  );
  operationData.selectedElement.css(properties);

  return operationData;
};
