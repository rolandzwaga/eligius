import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

export interface IRemoveElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation removes the given selected element from the DOM.
 *
 * Controllers attached to the element or its descendants (by `addControllerToElement`) are
 * detached first, so their eventbus and window listeners do not outlive the element.
 *
 * @throws AggregateError When one or more controller `detach()` calls throw. The element is removed anyway.
 *
 * @category DOM
 */
export const removeElement: TOperation<IRemoveElementOperationData> = function (
  this: IOperationScope,
  operationData: IRemoveElementOperationData
) {
  const {selectedElement} = operationData;
  const errors = detachControllersWithin(selectedElement, this.eventbus);
  selectedElement.remove();
  if (errors.length) {
    throw new AggregateError(
      errors,
      'removeElement: detaching controllers of the removed element failed'
    );
  }
  return operationData;
};
