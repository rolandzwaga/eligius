import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

export interface ISetElementContentOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @erased
   */
  template: string | JQuery.Node;
  /**
   * overwite = the contents of the selected element are replaced by the given template
   *
   * append = the new content will be inserted after the current content
   *
   * prepend = the new content will be inserted before the current content
   *
   * @erased
   */
  insertionType: 'overwrite' | 'append' | 'prepend';
}

/**
 * This operation sets the specified content defined by the value assigned to the template property
 * to the given selected element.
 *
 * When the `insertionType` is set to `overwrite` the contents of the selected element are replaced
 * by the given template.
 * When set to `append` the new content will be inserted after the current content.
 * When set to `prepend` the new content will be inserted before the current content.
 *
 * With `overwrite`, controllers attached to the replaced content (by `addControllerToElement`) are
 * detached first. Controllers on the selected element itself stay attached.
 *
 * @throws AggregateError When one or more controller `detach()` calls throw. The content is replaced anyway.
 *
 * @category DOM
 */
export const setElementContent: TOperation<
  ISetElementContentOperationData,
  Omit<ISetElementContentOperationData, 'template' | 'insertionType'>
> = function (
  this: IOperationScope,
  operationData: ISetElementContentOperationData
) {
  const {
    insertionType = 'overwrite',
    selectedElement,
    template,
  } = operationData;

  let detachErrors: unknown[] = [];

  switch (true) {
    case insertionType === 'overwrite':
      detachErrors = detachControllersWithin(
        selectedElement.children(),
        this.eventbus
      );
      selectedElement.html(template);
      break;
    case insertionType === 'append':
      selectedElement.append(template);
      break;
    case insertionType === 'prepend':
      selectedElement.prepend(template);
      break;
  }

  removeProperties(operationData, 'insertionType', 'template');

  if (detachErrors.length) {
    throw new AggregateError(
      detachErrors,
      'setElementContent: detaching controllers of the replaced content failed'
    );
  }

  return operationData;
};
