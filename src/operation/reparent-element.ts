import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

export interface IReparentElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:selector
   * @required
   * @erased
   */
  newParentSelector: string;
}

/**
 * This operation moves the given selected element to the new parent that is defined
 * by the specified `newParentSelector`. jQuery data, event handlers and attached controllers
 * are preserved.
 *
 * The selector is resolved inside the engine root (the root itself included), the same way
 * `selectElement` resolves its selector, and must match exactly one element. HTML strings are
 * not accepted.
 *
 * @param operationData
 * @returns
 * @throws When the selector is empty or HTML, when the engine root is not available, or when the
 * selector matches no element or more than one element.
 *
 * @category DOM
 */
export const reparentElement: TOperation<
  IReparentElementOperationData,
  Omit<IReparentElementOperationData, 'newParentSelector'>
> = function (
  this: IOperationScope,
  operationData: IReparentElementOperationData
) {
  const {selectedElement, newParentSelector} = operationData;
  removeProperties(operationData, 'newParentSelector');

  if (typeof newParentSelector !== 'string' || !newParentSelector.trim()) {
    throw new Error('reparentElement: newParentSelector is required');
  }
  // jQuery would parse a string like '<div>' as HTML and create new nodes
  if (newParentSelector.trim().startsWith('<')) {
    throw new Error(
      'reparentElement: newParentSelector must be a selector, not HTML'
    );
  }

  const root = this.eventbus.request<JQuery>('request-engine-root');
  if (!root?.length) {
    throw new Error('reparentElement: the engine root is not available');
  }

  const target = root
    .filter(newParentSelector)
    .add(root.find(newParentSelector));

  if (target.length === 0) {
    throw new Error(
      `reparentElement: '${newParentSelector}' matched no element inside the engine root`
    );
  }
  if (target.length > 1) {
    // appendTo would insert clones into every target but the last
    throw new Error(
      `reparentElement: '${newParentSelector}' matched ${target.length} elements, expected exactly one`
    );
  }

  // appendTo moves the existing node; .remove() would strip its jQuery data and handlers
  selectedElement.appendTo(target);
  return operationData;
};
