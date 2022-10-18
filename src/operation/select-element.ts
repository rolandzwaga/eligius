import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

function findElementBySelector(
  root: JQuery,
  selector: string,
  operationData: any,
  propertyName: string
) {
  const element = root.find(selector);
  if (!element.length) {
    console.warn(`selector '${selector}' wasn't found!`);
  }
  operationData[propertyName] = element;
  if (operationData.hasOwnProperty('propertyName')) {
    delete operationData.propertyName;
  }
}

export interface ISelectElementOperationData {
  selector: string;
  propertyName?: string;
  useSelectedElementAsRoot?: boolean;
  selectedElement?: JQuery;
}

/**
 * This operation selects one or more elements using the specified selector.
 *
 * If useSelectedElementAsRoot is set to true and a valid DOM element is assigned
 * to the current operation data defined by the given property name (defaults to 'selectedElement')
 * then the element will be looked for only in the child elements of this DOM element.
 *
 * @param operationData
 * @returns
 */
export const selectElement: TOperation<ISelectElementOperationData> = function (
  operationData: ISelectElementOperationData
) {
  const {
    selector,
    propertyName = 'selectedElement',
    useSelectedElementAsRoot = false,
  } = operationData;

  if (!selector) {
    throw new Error('selector is undefined!');
  }

  if (useSelectedElementAsRoot && (operationData as any)[propertyName]) {
    const currentRoot = (operationData as any)[propertyName];
    findElementBySelector(currentRoot, selector, operationData, propertyName);
    return operationData;
  }

  const rootCallback = (root: JQuery) => {
    findElementBySelector(root, selector, operationData, propertyName);
  };
  this.eventbus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [
    rootCallback,
  ]);

  return operationData;
};
