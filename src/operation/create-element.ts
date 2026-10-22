import {assertSafeAttribute} from '@operation/helper/assert-safe-attribute.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {resolvePropertyValues} from '@operation/helper/resolve-property-values.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';
import $ from 'jquery';
import type {RequireKeys} from '@/types.ts';

export type TTagNames = keyof HTMLElementTagNameMap;

const validElementName = /^[a-z][a-z0-9-]*$/i;

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
 * The element is built with DOM APIs: attribute values are set with `.attr()` and `text` is set as
 * text content, so neither is parsed as HTML.
 *
 * Values may be resolved from user data, so nothing that runs script is created: `script`
 * elements, event handler (`on*`) and `srcdoc` attributes, and `javascript:` or `vbscript:`
 * URLs in URL attributes such as `href`, `src` and `formaction` are refused.
 *
 * @param operationData
 * @returns
 * @throws When `elementName` is not a valid element name or is `script`, or when an attribute
 * is refused (see above). The message names the operation.
 * @category DOM
 */
export const createElement: TOperation<
  ICreateElementOperationData<TTagNames>,
  Omit<
    RequireKeys<ICreateElementOperationData<TTagNames>, 'template'>,
    'elementName' | 'text' | 'attributes'
  >
> = function <T extends TTagNames>(
  this: IOperationScope,
  operationData: ICreateElementOperationData<T>
) {
  // Resolve only this operation's own properties: other operation data is
  // passed on to later operations untouched.
  const {elementName, attributes, text} = resolvePropertyValues(
    operationData,
    this,
    {
      elementName: operationData.elementName,
      attributes: operationData.attributes,
      text: operationData.text,
    }
  ) as Pick<
    ICreateElementOperationData<T>,
    'elementName' | 'attributes' | 'text'
  >;

  removeProperties(operationData, 'elementName', 'attributes', 'text');

  if (!validElementName.test(String(elementName))) {
    throw new Error(
      `createElement: invalid elementName '${String(elementName)}', expected a tag name such as 'div' or 'my-element'`
    );
  }

  if (String(elementName).toLowerCase() === 'script') {
    throw new Error(
      "createElement: elementName 'script' is not allowed, configuration may not create scripts"
    );
  }

  const entries = Object.entries(attributes ?? {}).filter(([_, value]) =>
    Boolean(value)
  );
  // Check every attribute before the element is created
  entries.forEach(([key, value]) => {
    assertSafeAttribute('createElement', key, value);
  });

  const template = $<HTMLElement>(document.createElement(elementName));

  entries.forEach(([key, value]) => {
    template.attr(key, String(value));
  });

  if (text) {
    template.text(text);
  }

  operationData.template = template;

  return operationData as RequireKeys<
    ICreateElementOperationData<TTagNames>,
    'template'
  >;
};
