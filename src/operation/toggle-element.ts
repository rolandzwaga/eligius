import type {TOperation} from '@operation/types.ts';

export interface IToggleElementOperationData {
  /**
   * The element whose visibility will be toggled
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation toggles the visibility of the given selected element.
 *
 * Meaning, if the element is hidden, it will be made visible, otherwise
 * it will be hidden.
 *
 * @category DOM
 */
export const toggleElement: TOperation<IToggleElementOperationData> =
  function toggleElement(operationData: IToggleElementOperationData) {
    operationData.selectedElement.toggle();
    return operationData;
  };
