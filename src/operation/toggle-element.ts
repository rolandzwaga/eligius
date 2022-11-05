import { TOperation } from './types';

export interface IToggleElementOperationData {
  /**
   * The element whose visibility will be toggled
   */
  selectedElement: JQuery;
}

/**
 * This operation toggles the visibility of the given selected element.
 * 
 * Meaning, if the element is hidden, it will be made visible, otherwise
 * it will be hidden.
 *
 * @param operationData
 * @returns
 */
export const toggleElement: TOperation<IToggleElementOperationData> =
  function toggleElement(operationData: IToggleElementOperationData) {
    operationData.selectedElement.toggle();
    return operationData;
  };
