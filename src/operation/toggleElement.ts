import { TOperation } from '../action/types';

export interface IToggleElementOperationData {
  selectedElement: JQuery;
}

const toggleElement: TOperation<IToggleElementOperationData> = function toggleElement(operationData, _eventBus) {
  operationData.selectedElement.toggle();
  return operationData;
};

export default toggleElement;
