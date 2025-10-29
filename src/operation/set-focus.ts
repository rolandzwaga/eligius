import type {TOperation} from './types.ts';

export interface ISetFocusOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * Sets focus to the selected element.
 *
 * @category Focus
 */
export const setFocus: TOperation<
  ISetFocusOperationData,
  ISetFocusOperationData
> = (operationData: ISetFocusOperationData) => {
  const {selectedElement} = operationData;

  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('setFocus: selectedElement is required');
  }

  selectedElement[0].focus();

  return operationData;
};
