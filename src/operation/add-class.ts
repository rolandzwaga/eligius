import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface IAddClassOperationData {
  selectedElement: JQuery;
  className: string;
}

export const addClass: TOperation<IAddClassOperationData> = function(
  operationData: IAddClassOperationData,
  _eventBus: IEventbus
) {
  const { selectedElement, className } = operationData;
  selectedElement.addClass(className);
  return operationData;
};
