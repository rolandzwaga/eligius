import { TOperation } from './types';

export interface IToggleElementOperationData {
  selectedElement: JQuery;
}

/**
 * This operation toggles the visibility of the specified selected element
 *
 * @param operationData
 * @returns
 */
export const toggleElement: TOperation<IToggleElementOperationData> =
  function toggleElement(operationData: IToggleElementOperationData) {
    operationData.selectedElement.toggle();
    return operationData;
  };
