import { IEventbus } from '~/eventbus/types';
import { TOperation } from './types';

export interface IClearElementOperationData {
  selectedElement: JQuery;
}

export const clearElement: TOperation<IClearElementOperationData> = function (
  operationData: IClearElementOperationData,
  _eventBus: IEventbus
) {
  const { selectedElement } = operationData;
  selectedElement.empty();
  return operationData;
};
