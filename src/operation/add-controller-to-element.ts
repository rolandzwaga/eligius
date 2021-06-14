import { IController } from '../controllers/types';
import { attachControllerToElement } from './helper/attach-controller-to-element';
import { internalResolve } from './helper/internal-resolve';
import { TOperation } from './types';

export interface IAddControllerToElementOperationData {
  selectedElement: JQuery;
  controllerInstance: IController<any>;
  [key: string]: any;
}

export const addControllerToElement: TOperation<IAddControllerToElementOperationData> = function(
  operationData: IAddControllerToElementOperationData
) {
  const { selectedElement, controllerInstance } = operationData;

  attachControllerToElement(selectedElement, controllerInstance);

  controllerInstance.init(operationData);

  const promise = controllerInstance.attach(this.eventbus);

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
