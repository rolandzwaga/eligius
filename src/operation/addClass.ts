import { TOperation } from '../action/types';

export interface IAddClassOperationData {
  selectedElement: JQuery;
  className: string;
}

const addClass: TOperation<IAddClassOperationData> = function (operationData, _eventBus) {
  const { selectedElement, className } = operationData;
  selectedElement.addClass(className);
  return operationData;
};

export default addClass;
