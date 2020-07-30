import { TOperation } from '../action/types';

export interface IToggleClassOperationData {
  selectedElement: JQuery;
  className: string;
}

const toggleClass: TOperation<IToggleClassOperationData> = function (operationData, _eventBus) {
  const { selectedElement, className } = operationData;
  selectedElement.toggleClass(className);
  return operationData;
};

export default toggleClass;
