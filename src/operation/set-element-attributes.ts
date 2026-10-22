import {assertSafeAttribute} from '@operation/helper/assert-safe-attribute.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface ISetElementAttributesOperationData {
  /**
   * @required
   * @erased
   */
  attributes: Record<string, unknown>;
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation sets the specified set of attributes on the given selected element.
 *
 * Event handler (`on*`) and `srcdoc` attributes, and `javascript:` or `vbscript:` URLs in URL
 * attributes such as `href`, `src` and `formaction`, are refused, the same as in `createElement`.
 *
 * @throws When an attribute is refused. No attribute is set then.
 *
 * @category DOM
 */
export const setElementAttributes: TOperation<
  ISetElementAttributesOperationData,
  Omit<ISetElementAttributesOperationData, 'attributes'>
> = (operationData: ISetElementAttributesOperationData) => {
  const {attributes, selectedElement} = operationData;
  removeProperties(operationData, 'attributes');
  Object.entries(attributes ?? {}).forEach(([name, value]) => {
    assertSafeAttribute('setElementAttributes', name, value);
  });
  selectedElement.attr(attributes);
  return operationData;
};
