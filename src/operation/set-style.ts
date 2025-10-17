import {resolvePropertyValues} from './helper/resolve-property-values.ts';
import type {TOperation} from './types.ts';

export interface ISetStyleOperationData {
  /**
   * @required
   * @erased
   */
  properties: Record<string, any>;
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation assigns the specified CSS style properties to the
 * given selected element.
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

  delete (operationData as any).properties;

  return operationData;
};
