import { TOperation } from './types';

export interface IReparentElementOperationData {
  selectedElement: JQuery;
  newParentSelector: string;
}

/**
 * This operation moves the given selected element to the new parent that is defined
 * by the specified `newParentSelector`.
 *
 * @param operationData
 * @returns
 */
export const reparentElement: TOperation<IReparentElementOperationData> =
  function (operationData: IReparentElementOperationData) {
    const { selectedElement, newParentSelector } = operationData;
    selectedElement.remove().appendTo(newParentSelector);
    return operationData;
  };
