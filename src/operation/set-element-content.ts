import { IEventbus } from '~/eventbus/types';
import { TOperation } from './types';

export interface ISetElementContentOperationData {
  selectedElement: JQuery;
  append?: boolean;
  template: string | JQuery.Node;
}

export const setElementContent: TOperation<ISetElementContentOperationData> = function (
  operationData: ISetElementContentOperationData,
  _eventBus: IEventbus
) {
  const { append = false, selectedElement, template } = operationData;

  if (!append) {
    selectedElement.html(template);
  } else {
    selectedElement.append(template);
  }
  return operationData;
};
