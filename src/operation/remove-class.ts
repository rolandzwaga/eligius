import { TOperation } from './types';

export interface IRemoveClassOperationData {
  selectedElement: JQuery;
  className: string;
}

/**
 * This operation removes the spcified class name from the given selected element.
 *
 * @param operationData
 * @returns
 */
export const removeClass: TOperation<IRemoveClassOperationData> = function (
  operationData: IRemoveClassOperationData
) {
  const { selectedElement, className } = operationData;
  selectedElement.removeClass(className);
  return operationData;
};
