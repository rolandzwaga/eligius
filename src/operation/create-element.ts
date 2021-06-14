import $ from 'jquery';
import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export type TTagNames = keyof HTMLElementTagNameMap;

export interface ICreateElementOperationData<T extends TTagNames> {
  elementName: T;
  text?: string;
  attributes?: Partial<HTMLElementTagNameMap[T]>;
  propertyName?: string;
  template?: JQuery;
}

export const createElement: TOperation<ICreateElementOperationData<
  any
>> = function<T extends TTagNames>(
  operationData: ICreateElementOperationData<T>
) {
  operationData = resolvePropertyValues(operationData, operationData);
  const {
    elementName,
    attributes,
    text,
    propertyName = 'template',
  } = operationData;

  const serializedAttrs = attributes
    ? ' ' +
      Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
    : '';

  const template = text
    ? $(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
    : $(`<${elementName}${serializedAttrs}/>`);

  (operationData as any)[propertyName] = template;

  delete operationData.propertyName;
  return operationData;
};
