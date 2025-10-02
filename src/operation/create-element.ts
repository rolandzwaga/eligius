import $ from 'jquery';
import type {RequireKeys} from 'types.ts';
import {resolvePropertyValues} from './helper/resolve-property-values.ts';
import type {IOperationContext, TOperation} from './types.ts';

export type TTagNames = keyof HTMLElementTagNameMap;

export interface ICreateElementOperationData<T extends TTagNames> {
  /**
   * @required
   */
  elementName: T;
  text?: string;
  /**
   * @type=ParameterType:object
   */
  attributes?: Partial<HTMLElementTagNameMap[T]>;
  /**
   * @type=ParameterType:object
   * @output
   */
  template?: JQuery;
}

/**
 * This operation creates the DOM element described by the given elementName and attributes and assigns
 * the instance to the `template` property on the current operation data.
 *
 * @param operationData
 * @returns
 */
export const createElement: TOperation<
  ICreateElementOperationData<TTagNames>,
  RequireKeys<ICreateElementOperationData<TTagNames>, 'template'>
> = function <T extends TTagNames>(
  this: IOperationContext,
  operationData: ICreateElementOperationData<T>
) {
  operationData = resolvePropertyValues(operationData, this, operationData);

  const {elementName, attributes, text} = operationData;

  const serializedAttrs = attributes
    ? ` ${Object.entries(attributes)
        .filter(([_, value]) => Boolean(value))
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')}`
    : '';

  const template = text
    ? $(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
    : $(`<${elementName}${serializedAttrs}/>`);

  operationData.template = template;

  return operationData as RequireKeys<
    ICreateElementOperationData<TTagNames>,
    'template'
  >;
};
