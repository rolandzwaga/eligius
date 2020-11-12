import { IEventbus } from '~/eventbus/types';
import { TOperation } from './types';

export interface IReparentElementOperationData {
  selectedElement: JQuery;
  newParentSelector: string;
}

export const reparentElement: TOperation<IReparentElementOperationData> = function (
  operationData: IReparentElementOperationData,
  _eventBus: IEventbus
) {
  const { selectedElement, newParentSelector } = operationData;
  selectedElement.remove().appendTo(newParentSelector);
  return operationData;
};
