import { TOperation } from './types';

export interface ISetElementAttributesOperationData {
  attributes: Record<string, any>;
  selectedElement: JQuery;
}

/**
 * This operation sets the specified set of attributes on the given selected element.
 *
 * @param operationData
 * @returns
 */
export const setElementAttributes: TOperation<ISetElementAttributesOperationData> =
  function (operationData: ISetElementAttributesOperationData) {
    const { attributes, selectedElement } = operationData;
    selectedElement.attr(attributes);
    return operationData;
  };
