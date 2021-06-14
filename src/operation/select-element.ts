import { IEventbus } from '../eventbus/types';
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
}

export const selectElement: TOperation<ISelectElementOperationData> = function(
  operationData: ISelectElementOperationData,
  eventBus: IEventbus
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
  eventBus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [rootCallback]);

  return operationData;
};
