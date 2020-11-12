import { IEventbus } from '~/eventbus/types';
import { TOperation } from './types';

export interface IToggleClassOperationData {
  selectedElement: JQuery;
  className: string;
}

export const toggleClass: TOperation<IToggleClassOperationData> = function (
  operationData: IToggleClassOperationData,
  _eventBus: IEventbus
) {
  const { selectedElement, className } = operationData;
  selectedElement.toggleClass(className);
  return operationData;
};
