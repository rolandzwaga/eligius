import { TOperation } from './types';

export interface IGetAttributesFromElementOperationData {
  /**
   * The HTML element whose attributes will be retrieved
   */
  selectedElement?: JQuery;
  /**
   * The specified attribute names that will be retrieved
   */
  attributeNames: string[];
  /**
   * The retrieved attributes
   */
  attributeValues?: Record<string, any>;
}

/**
 * This operation retrieves the values for the specified attribute names from  the given selected element.
 */
export const getAttributesFromElement: TOperation<IGetAttributesFromElementOperationData> =
  function (operationData: IGetAttributesFromElementOperationData) {
    const { selectedElement, attributeNames } = operationData;

    operationData.attributeValues = attributeNames.reduce((acc, attrName) => {
      acc[attrName] = selectedElement?.attr(attrName);
      return acc;
    }, {} as Record<string, any>);

    return operationData;
  };
