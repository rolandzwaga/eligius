import { IEventbus } from '~/eventbus/types';
import { TOperation } from './types';

export interface ISetElementContentOperationData {
  append: boolean;
  selectedElement: JQuery;
  template: string;
}

export const setElementContent: TOperation<ISetElementContentOperationData> = function (
  operationData: ISetElementContentOperationData,
  _eventBus: IEventbus
) {
  const { append, selectedElement, template } = operationData;
  if (!append) {
    selectedElement.html(template);
  } else {
    selectedElement.append(template);
  }
  return operationData;
};
