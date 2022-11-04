import { TOperation } from './types';

export interface IRemoveElementOperationData {
  selectedElement: JQuery;
}

/**
 * This operation removes the given selected element from the DOM.
 *
 * @param operationData
 * @returns
 */
export const removeElement: TOperation<IRemoveElementOperationData> = function (
  operationData: IRemoveElementOperationData
) {
  const { selectedElement } = operationData;
  selectedElement.remove();
  return operationData;
};
