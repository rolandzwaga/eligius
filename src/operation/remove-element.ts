import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface IRemoveElementOperationData {
  selectedElement: JQuery;
}

export const removeElement: TOperation<IRemoveElementOperationData> = function (
  operationData: IRemoveElementOperationData,
  _eventBus: IEventbus
) {
  const { selectedElement } = operationData;
  selectedElement.remove();
  return operationData;
};
