import { TOperation } from './types';

export interface IToggleElementOperationData {
  selectedElement: JQuery;
}

export const toggleElement: TOperation<IToggleElementOperationData> = function toggleElement(
  operationData: IToggleElementOperationData
) {
  operationData.selectedElement.toggle();
  return operationData;
};
