import { TOperation } from '../action/types';

export interface IRemoveClassOperationData {
  selectedElement: JQuery;
  className: string;
}

const removeClass: TOperation<IRemoveClassOperationData> = function (operationData, _eventBus) {
  const { selectedElement, className } = operationData;
  selectedElement.removeClass(className);
  return operationData;
};

export default removeClass;
