import { TOperation } from '../action/types';

export interface IRemoveElementOperationData {
  selectedElement: JQuery;
}

const removeElement: TOperation<IRemoveElementOperationData> = function (operationData, _eventBus) {
  const { selectedElement } = operationData;
  selectedElement.remove();
  return operationData;
};

export default removeElement;
