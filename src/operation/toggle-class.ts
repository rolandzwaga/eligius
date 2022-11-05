import { TOperation } from './types';

export interface IToggleClassOperationData {
  /**
   * The element on which the class will be toggled
   */
  selectedElement: JQuery;
  /**
   * The class that will be toggled
   */
  className: string;
}

/**
 * This operation toggles the specfied class name on the given selected element.
 * 
 * Meaning, if the specified class name exists on the given element it will be removed,
 * otherwise it will be added.
 *
 * @param operationData
 * @returns
 */
export const toggleClass: TOperation<IToggleClassOperationData> = function (
  operationData: IToggleClassOperationData
) {
  const { selectedElement, className } = operationData;
  selectedElement.toggleClass(className);
  return operationData;
};
