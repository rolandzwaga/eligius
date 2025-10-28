import type {TOperation} from './types.ts';

export interface IReparentElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:selector
   * @required
   * @erased
   */
  newParentSelector: string;
}

/**
 * This operation moves the given selected element to the new parent that is defined
 * by the specified `newParentSelector`.
 *
 * @param operationData
 * @returns
 */
export const reparentElement: TOperation<IReparentElementOperationData, Omit<IReparentElementOperationData, 'newParentSelector'>> = (
  operationData: IReparentElementOperationData
) => {
  const {selectedElement, newParentSelector} = operationData;
  delete (operationData as any).newParentSelector;
  selectedElement.remove().appendTo(newParentSelector);
  return operationData;
};
