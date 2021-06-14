import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface IRemoveClassOperationData {
  selectedElement: JQuery;
  className: string;
}

export const removeClass: TOperation<IRemoveClassOperationData> = function(
  operationData: IRemoveClassOperationData,
  _eventBus: IEventbus
) {
  const { selectedElement, className } = operationData;
  selectedElement.removeClass(className);
  return operationData;
};
