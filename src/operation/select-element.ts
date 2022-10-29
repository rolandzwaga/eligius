import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

function findElementBySelector(
  root: JQuery,
  selector: string,
  operationData: ISelectElementOperationData
) {
  const element = root.find(selector);
  if (!element.length) {
    console.warn(`selector '${selector}' wasn't found!`);
  }
  operationData.selectedElement = element;
}

export interface ISelectElementOperationData {
  selector: string;
  useSelectedElementAsRoot?: boolean;
  selectedElement?: JQuery;
}

/**
 * This operation selects one or more elements using the specified selector.
 *
 * If useSelectedElementAsRoot is set to true and a valid DOM element is assigned
 * to the current operation data's `selectedElement` property
 * then the element will be looked for only in the descendant elements of this DOM element.
 *
 * @param operationData
 * @returns
 */
export const selectElement: TOperation<ISelectElementOperationData> = function (
  operationData: ISelectElementOperationData
) {
  const { selector, useSelectedElementAsRoot = false } = operationData;

  if (!selector) {
    throw new Error('selector is undefined!');
  }

  if (useSelectedElementAsRoot && operationData.selectedElement) {
    const currentRoot = operationData.selectedElement;
    findElementBySelector(currentRoot, selector, operationData);
    return operationData;
  }

  const rootCallback = (root: JQuery) => {
    findElementBySelector(root, selector, operationData);
  };
  this.eventbus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [
    rootCallback,
  ]);

  return operationData;
};
