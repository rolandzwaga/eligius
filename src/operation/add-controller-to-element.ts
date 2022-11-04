import { IController } from '../controllers/types';
import { attachControllerToElement } from './helper/attach-controller-to-element';
import { internalResolve } from './helper/internal-resolve';
import { IOperationContext, TOperation, TOperationData } from './types';

export type IAddControllerToElementOperationData<
  T extends TOperationData = TOperationData
> = {
  selectedElement: JQuery;
  controllerInstance: IController<T>;
} & T;

/**
 * This operation adds the specified controller instance to the given selected element.
 *
 * @param operationData
 * @returns
 */
export const addControllerToElement: TOperation<IAddControllerToElementOperationData> =
  function <T extends TOperationData = TOperationData>(
    this: IOperationContext,
    operationData: IAddControllerToElementOperationData<T>
  ) {
    const { selectedElement, controllerInstance } = operationData;

    attachControllerToElement(selectedElement, controllerInstance);

    controllerInstance.init(operationData);

    const promise = controllerInstance.attach(this.eventbus);

    if (promise) {
      return new Promise((resolve, reject) => {
        promise.then((newOperationData: TOperationData) => {
          internalResolve(resolve, operationData, newOperationData);
        }, reject);
      });
    } else {
      return operationData;
    }
  };
