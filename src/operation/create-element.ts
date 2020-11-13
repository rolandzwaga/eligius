import $ from 'jquery';
import { IEventbus } from '~/eventbus/types';
import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ICreateElementOperationData {
  elementName: string;
  attributes?: any;
  text: string;
  template: JQuery;
}

export const createElement: TOperation<ICreateElementOperationData> = function (
  operationData: ICreateElementOperationData,
  _eventBus: IEventbus
) {
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
