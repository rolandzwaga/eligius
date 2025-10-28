import $ from 'jquery';
import type {RequireKeys} from 'types.ts';
import {resolvePropertyValues} from './helper/resolve-property-values.ts';
import type {IOperationScope, TOperation} from './types.ts';

export type TTagNames = keyof HTMLElementTagNameMap;

export interface ICreateElementOperationData<T extends TTagNames> {
  /**
   * @type=ParameterType:htmlElementName
   * @required
   * @erased
   */
  elementName: T;
  /**
   * @erased
   */
  text?: string;
  /**
   * @type=ParameterType:object
   * @erased
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
  Omit<RequireKeys<ICreateElementOperationData<TTagNames>, 'template'>, 'elementName'|'text'|'attributes'>
> = function <T extends TTagNames>(
  this: IOperationScope,
  operationData: ICreateElementOperationData<T>
) {
  operationData = resolvePropertyValues(operationData, this, operationData);

  const {elementName, attributes, text} = operationData;
  
  delete (operationData as any).elementName;
  delete (operationData as any).attributes;
  delete (operationData as any).text;

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
