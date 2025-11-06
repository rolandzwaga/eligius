import $ from 'jquery';
import type {TOperation} from './types.ts';

export interface IGetFocusedElementOperationData {
  /**
   * @type=ParameterType:jQuery
   * @output
   */
  focusedElement: JQuery;
}

/**
 * Gets the currently focused element.
 *
 * @category Focus
 */
export const getFocusedElement: TOperation<
  IGetFocusedElementOperationData,
  IGetFocusedElementOperationData
> = (operationData: IGetFocusedElementOperationData) => {
  operationData.focusedElement = document.activeElement
    ? $(document.activeElement as HTMLElement)
    : $();
  return operationData;
};
