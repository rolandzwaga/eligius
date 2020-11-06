import { TOperation } from '../action/types';

export interface IReparentElementOperationData {
  selectedElement: JQuery;
  newParentSelector: string;
}

const reparentElement: TOperation<IReparentElementOperationData> = function (operationData, _eventBus) {
  const { selectedElement, newParentSelector } = operationData;
  selectedElement.remove().appendTo(newParentSelector);
  return operationData;
};

export default reparentElement;
