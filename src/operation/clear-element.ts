import { TOperation } from './types';

export interface IClearElementOperationData {
  selectedElement: JQuery;
}

export const clearElement: TOperation<IClearElementOperationData> = function(
  operationData: IClearElementOperationData
) {
  const { selectedElement } = operationData;
  selectedElement.empty();
  return operationData;
};
