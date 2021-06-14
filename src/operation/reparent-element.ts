import { TOperation } from './types';

export interface IReparentElementOperationData {
  selectedElement: JQuery;
  newParentSelector: string;
}

export const reparentElement: TOperation<IReparentElementOperationData> = function(
  operationData: IReparentElementOperationData
) {
  const { selectedElement, newParentSelector } = operationData;
  selectedElement.remove().appendTo(newParentSelector);
  return operationData;
};
