import { TOperation } from '../action/types';
import { IController } from '../controllers/types';
import attachControllerToElement from './helper/attach-controller-to-element';
import internalResolve from './helper/internal-resolve';

export interface IAddControllerToElementOperationData {
  selectedElement: JQuery;
  controllerInstance: IController<any>;
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
