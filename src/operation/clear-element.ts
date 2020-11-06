import { TOperation } from '../action/types';

export interface IClearElementOperationData {
  selectedElement: JQuery;
}

const clearElement: TOperation<IClearElementOperationData> = function (operationData, _eventBus) {
  const { selectedElement } = operationData;
  selectedElement.empty();
  return operationData;
};

export default clearElement;
