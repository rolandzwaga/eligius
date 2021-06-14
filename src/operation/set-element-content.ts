import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface ISetElementContentOperationData {
  selectedElement: JQuery;
  template: string | JQuery.Node;
  insertionType?: 'append' | 'prepend';
}

export const setElementContent: TOperation<ISetElementContentOperationData> = function(
  operationData: ISetElementContentOperationData,
  _eventBus: IEventbus
) {
  const { insertionType, selectedElement, template } = operationData;

  switch (true) {
    case insertionType === undefined:
      selectedElement.html(template);
      break;
    case insertionType === 'append':
      selectedElement.append(template);
      break;
    case insertionType === 'prepend':
      selectedElement.prepend(template);
      break;
  }

  delete operationData.insertionType;

  return operationData;
};
