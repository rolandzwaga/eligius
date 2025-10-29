import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface ISetElementAttributesOperationData {
  /**
   * @required
   * @erased
   */
  attributes: Record<string, unknown>;
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation sets the specified set of attributes on the given selected element.
 *
 * @category DOM
 */
export const setElementAttributes: TOperation<
  ISetElementAttributesOperationData,
  Omit<ISetElementAttributesOperationData, 'attributes'>
> = (operationData: ISetElementAttributesOperationData) => {
  const {attributes, selectedElement} = operationData;
  removeProperties(operationData, 'attributes');
  selectedElement.attr(attributes);
  return operationData;
};
