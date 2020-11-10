import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface IToggleElementOperationData {
  selectedElement: JQuery;
}

export const toggleElement: TOperation<IToggleElementOperationData> = function toggleElement(
  operationData: IToggleElementOperationData,
  _eventBus: IEventbus
) {
  operationData.selectedElement.toggle();
  return operationData;
};
