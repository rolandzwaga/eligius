import $ from 'jquery';
import { resolvePropertyValues } from './helper/resolve-property-values';
import { IOperationContext, TOperation } from './types';

export type TTagNames = keyof HTMLElementTagNameMap;

export interface ICreateElementOperationData<T extends TTagNames> {
  elementName: T;
  text?: string;
  attributes?: Partial<HTMLElementTagNameMap[T]>;
  template?: JQuery;
}

/**
 * This operation creates the DOM element defined by the given properties and assigns
 * the instance to the give property name on the current operation data.
 * The property name defaults to 'template'.
 *
 * @param operationData
 * @returns
 */
export const createElement: TOperation<ICreateElementOperationData<any>> =
  function <T extends TTagNames>(
    this: IOperationContext,
    operationData: ICreateElementOperationData<T>
  ) {
    operationData = resolvePropertyValues(
      operationData,
      this,
      operationData
    ) as ICreateElementOperationData<T>;

    const { elementName, attributes, text } = operationData;

    const serializedAttrs = attributes
      ? ` ${Object.entries(attributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}`
      : '';

    const template = text
      ? $(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
      : $(`<${elementName}${serializedAttrs}/>`);

    operationData.template = template;

    return operationData;
  };
