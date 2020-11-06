import { TOperation } from '../action/types';

export interface ISetElementContentOperationData {
  append: boolean;
  selectedElement: JQuery;
  template: string;
}

const setElementContent: TOperation<ISetElementContentOperationData> = function (operationData, _eventBus) {
  const { append, selectedElement, template } = operationData;
  if (!append) {
    selectedElement.html(template);
  } else {
    selectedElement.append(template);
  }
  return operationData;
};

export default setElementContent;
