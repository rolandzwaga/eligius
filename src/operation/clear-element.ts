import type {TOperation} from './types.ts';

export interface IClearElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation removes all of the children from the given selected element.
 *
 * @category DOM
 */
export const clearElement: TOperation<IClearElementOperationData> = (
  operationData: IClearElementOperationData
) => {
  const {selectedElement} = operationData;
  selectedElement.empty();
  return operationData;
};
