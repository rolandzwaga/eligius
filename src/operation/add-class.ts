import { TOperation } from './types';

export interface IAddClassOperationData {
  selectedElement: JQuery;
  className: string;
}

/**
 * This operation adds the specified class name to the specified selected element.
 *
 * @param operationData
 * @returns
 */
export const addClass: TOperation<IAddClassOperationData> = function (
  operationData: IAddClassOperationData
) {
  const { selectedElement, className } = operationData;
  selectedElement.addClass(className);
  return operationData;
};
