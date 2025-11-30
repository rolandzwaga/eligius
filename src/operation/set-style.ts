import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {resolvePropertyValues} from '@operation/helper/resolve-property-values.ts';
import type {TOperation} from '@operation/types.ts';

export interface ISetStyleOperationData {
  /**
   * @type=ParameterType:cssProperties
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
 *
 * @category DOM
 */
export const setStyle: TOperation<
  ISetStyleOperationData,
  Omit<ISetStyleOperationData, 'properties'>
> = function (operationData: ISetStyleOperationData) {
  const properties = resolvePropertyValues(
    operationData,
    this,
    operationData.properties
  );
  operationData.selectedElement.css(properties as JQuery.PlainObject);

  removeProperties(operationData, 'properties');

  return operationData;
};
