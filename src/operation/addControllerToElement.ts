import attachControllerToElement from './helper/attachControllerToElement';
import internalResolve from './helper/internalResolve';
import { TOperation } from '../action/types';

export interface IAddControllerToElementOperationData {
  selectedElement: JQuery;
  controllerInstance: any;
}

const addControllerToElement: TOperation<IAddControllerToElementOperationData> = function (operationData, eventBus) {
  const { selectedElement, controllerInstance } = operationData;

  attachControllerToElement(selectedElement, controllerInstance);

  controllerInstance.init(operationData);

  const promise = controllerInstance.attach(eventBus);

  if (promise) {
    return new Promise((resolve, reject) => {
      promise.then((newOperationData: any) => {
        internalResolve(resolve, operationData, newOperationData);
      }, reject);
    });
  } else {
    return operationData;
  }
};

export default addControllerToElement;
