import { TOperation } from './types';

export interface IToggleClassOperationData {
  selectedElement: JQuery;
  className: string;
}

export const toggleClass: TOperation<IToggleClassOperationData> = function(
  operationData: IToggleClassOperationData
) {
  const { selectedElement, className } = operationData;
  selectedElement.toggleClass(className);
  return operationData;
};
