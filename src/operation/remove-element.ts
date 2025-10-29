import type {TOperation} from './types.ts';

export interface IRemoveElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation removes the given selected element from the DOM.
 *
 * @category DOM
 */
export const removeElement: TOperation<IRemoveElementOperationData> = (
  operationData: IRemoveElementOperationData
) => {
  const {selectedElement} = operationData;
  selectedElement.remove();
  return operationData;
};
