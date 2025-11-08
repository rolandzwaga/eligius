import {removeProperties} from './helper/remove-operation-properties.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from './helper/resolve-external-property-chain.ts';
import type {TOperation} from './types.ts';

function findElementBySelector(root: JQuery, selector: string) {
  const element = root.find(selector);
  if (!element.length) {
    console.warn(`selector '${selector}' wasn't found!`);
  }
  return element;
}

export interface ISelectElementOperationData {
  /**
   * @type=ParameterType:selector
   * @required
   * @erased
   */
  selector: string;
  /**
   * @erased
   */
  useSelectedElementAsRoot?: boolean;
  /**
   * @type=ParameterType:object
   * @output
   */
  selectedElement?: JQuery;
}

/**
 * This operation selects one or more elements using the specified selector.
 *
 * If `useSelectedElementAsRoot` is set to true and a valid DOM element is assigned
 * to the current operation data's `selectedElement` property
 * then the element will be looked for only in the descendant elements of this DOM element.
 *
 * @category DOM
 */
export const selectElement: TOperation<
  ISelectElementOperationData,
  Omit<ISelectElementOperationData, 'selector' | 'useSelectedElementAsRoot'>
> = function (operationData: ISelectElementOperationData) {
  operationData.selector = resolveExternalPropertyChain(
    operationData,
    this,
    operationData.selector as ExternalProperty
  ) as string;

  const {selector, useSelectedElementAsRoot = false} = operationData;

  removeProperties(operationData, 'selector', 'useSelectedElementAsRoot');

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
  this.eventbus.broadcast('request-engine-root', [rootCallback]);

  return operationData;
};
