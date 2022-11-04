import { TOperation } from './types';

export interface IClearElementOperationData {
  selectedElement: JQuery;
}

/**
 * This operation removes all of the children from the given selected element.
 * 
 */
export const clearElement: TOperation<IClearElementOperationData> = function(
  operationData: IClearElementOperationData
) {
  const { selectedElement } = operationData;
  selectedElement.empty();
  return operationData;
};
