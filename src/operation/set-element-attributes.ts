import { TOperation } from '../action/types';

export interface ISetElementAttributesOperationData {
  attributes: any;
  selectedElement: JQuery;
}

const setElementAttributes: TOperation<ISetElementAttributesOperationData> = function (operationData, _eventBus) {
  const { attributes, selectedElement } = operationData;
  Object.keys(attributes).forEach((attrName) => {
    selectedElement.attr(attrName, attributes[attrName]);
  });
  return operationData;
};

export default setElementAttributes;
