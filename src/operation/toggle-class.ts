import { TOperation } from './types';

export interface IToggleClassOperationData {
  selectedElement: JQuery;
  className: string;
}

/**
 * This operation toggles the specfied class name on the specified selected element.
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
