import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

export interface IClearElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation removes all of the children from the given selected element.
 *
 * Controllers attached to the removed children or their descendants (by `addControllerToElement`)
 * are detached first. Controllers on the selected element itself stay attached.
 *
 * @throws AggregateError When one or more controller `detach()` calls throw. The element is cleared anyway.
 *
 * @category DOM
 */
export const clearElement: TOperation<IClearElementOperationData> = function (
  this: IOperationScope,
  operationData: IClearElementOperationData
) {
  const {selectedElement} = operationData;
  const errors = detachControllersWithin(
    selectedElement.children(),
    this.eventbus
  );
  selectedElement.empty();
  if (errors.length) {
    throw new AggregateError(
      errors,
      'clearElement: detaching controllers of the removed children failed'
    );
  }
  return operationData;
};
