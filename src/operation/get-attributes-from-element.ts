import type { TOperation } from './types.ts';

export interface IGetAttributesFromElementOperationData {
  /**
   * The HTML element whose attributes will be retrieved
   * @dependency
   */
  selectedElement?: JQuery;
  /**
   * The specified attribute names that will be retrieved
   */
  attributeNames: string[];
  /**
   * The retrieved attributes
   * @output
   */
  attributeValues?: Record<string, unknown>;
}

/**
 * This operation retrieves the values for the specified attribute names from  the given selected element.
 */
export const getAttributesFromElement: TOperation<IGetAttributesFromElementOperationData> =
  function (operationData: IGetAttributesFromElementOperationData) {
    const { selectedElement, attributeNames } = operationData;

    operationData.attributeValues = attributeNames.reduce((acc, attrName) => {
      if (attrName !== 'value') {
        acc[attrName] = selectedElement?.attr(attrName);
      } else {
        acc[attrName] = selectedElement?.val();
      }
      return acc;
    }, {} as Record<string, unknown>);

    return operationData;
  };
