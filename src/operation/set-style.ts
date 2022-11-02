import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ISetStyleOperationData {
  properties: Record<string, any>;
  selectedElement: JQuery;
}

/**
 * This operation assigns the specified CSS style properties to the
 * specified selected element.
 *
 * @param operationData
 * @returns
 */
export const setStyle: TOperation<ISetStyleOperationData> = function (
  operationData: ISetStyleOperationData
) {
  const properties = resolvePropertyValues(
    operationData,
    this,
    operationData.properties
  );
  operationData.selectedElement.css(properties as JQuery.PlainObject);

  return operationData;
};
