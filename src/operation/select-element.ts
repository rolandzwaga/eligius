import { TimelineEventNames } from '../timeline-event-names';
import { resolveExternalPropertyChain } from './helper/resolve-external-property-chain';
import { TOperation } from './types';

function findElementBySelector(root: JQuery, selector: string) {
  const element = root.find(selector);
  if (!element.length) {
    console.warn(`selector '${selector}' wasn't found!`);
  }
  return element;
}

export interface ISelectElementOperationData {
  selector: string;
  useSelectedElementAsRoot?: boolean;
  selectedElement?: JQuery;
}

/**
 * This operation selects one or more elements using the specified selector.
 *
 * If `useSelectedElementAsRoot` is set to true and a valid DOM element is assigned
 * to the current operation data's `selectedElement` property
 * then the element will be looked for only in the descendant elements of this DOM element.
 *
 * @param operationData
 * @returns
 */
export const selectElement: TOperation<ISelectElementOperationData> = function (
  operationData: ISelectElementOperationData
) {
  operationData.selector = resolveExternalPropertyChain(
    operationData,
    this,
    operationData.selector
  );
  const { selector, useSelectedElementAsRoot = false } = operationData;

  if (!selector) {
    throw new Error('selectElement: selector is either empty or not defined.');
  }

  if (useSelectedElementAsRoot && operationData.selectedElement) {
    const currentRoot = operationData.selectedElement;
    operationData.selectedElement = findElementBySelector(
      currentRoot,
      selector
    );
    return operationData;
  }

  const rootCallback = (root: JQuery) => {
    operationData.selectedElement = findElementBySelector(root, selector);
  };
  this.eventbus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [
    rootCallback,
  ]);

  return operationData;
};
