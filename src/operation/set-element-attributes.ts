import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

export interface ISetElementAttributesOperationData {
  attributes: any;
  selectedElement: JQuery;
}

export const setElementAttributes: TOperation<ISetElementAttributesOperationData> = function (
  operationData: ISetElementAttributesOperationData,
  _eventBus: IEventbus
) {
  const { attributes, selectedElement } = operationData;
  Object.keys(attributes).forEach((attrName) => {
    selectedElement.attr(attrName, attributes[attrName]);
  });
  return operationData;
};
