import { TOperation } from './types';

export interface IRemoveClassOperationData {
  selectedElement: JQuery;
  className: string;
}

export const removeClass: TOperation<IRemoveClassOperationData> = function(
  operationData: IRemoveClassOperationData
) {
  const { selectedElement, className } = operationData;
  selectedElement.removeClass(className);
  return operationData;
};
