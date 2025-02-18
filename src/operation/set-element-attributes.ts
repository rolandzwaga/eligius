import type { TOperation } from './types.ts';

export interface ISetElementAttributesOperationData {
  /**
   * @required
   */
  attributes: Record<string, unknown>;
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation sets the specified set of attributes on the given selected element.
 */
export const setElementAttributes: TOperation<ISetElementAttributesOperationData> =
  function (operationData: ISetElementAttributesOperationData) {
    const { attributes, selectedElement } = operationData;
    selectedElement.attr(attributes);
    return operationData;
  };
