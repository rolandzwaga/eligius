import { TOperation } from './types';

export interface IRemoveElementOperationData {
  selectedElement: JQuery;
}

export const removeElement: TOperation<IRemoveElementOperationData> = function(
  operationData: IRemoveElementOperationData
) {
  const { selectedElement } = operationData;
  selectedElement.remove();
  return operationData;
};
