import $ from 'jquery';
import resolvePropertyValues from './helper/resolvePropertyValues';
import { TOperation } from '../action/types';

export interface ICreateElementOperationData {
  elementName: string;
  attributes: any;
  text: string;
  template: JQuery;
}

const createElement: TOperation<ICreateElementOperationData> = function (operationData, _eventBus) {
  operationData = resolvePropertyValues(operationData, operationData);
  const { elementName, attributes, text } = operationData;
  const serializedAttrs = attributes
    ? ' ' +
      Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
    : '';
  const template = text
    ? $(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
    : $(`<${elementName}${serializedAttrs}/>`);
  operationData.template = template;
  return operationData;
};

export default createElement;
