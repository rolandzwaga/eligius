import { TOperation } from './types';

export interface ISetElementAttributesOperationData {
  attributes: Record<string, any>;
  selectedElement: JQuery;
}

/**
 * This operation sets the given set of attributes on the specified selected element.
 *
 * @param operationData
 * @returns
 */
export const setElementAttributes: TOperation<ISetElementAttributesOperationData> =
  function (operationData: ISetElementAttributesOperationData) {
    const { attributes, selectedElement } = operationData;
    Object.entries(attributes).forEach(([attrName, attrValue]) => {
      selectedElement.attr(attrName, attrValue);
    });
    return operationData;
  };
