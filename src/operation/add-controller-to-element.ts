import type {IController} from '../controllers/types.ts';
import {attachControllerToElement} from './helper/attach-controller-to-element.ts';
import {internalResolve} from './helper/internal-resolve.ts';
import type {IOperationScope, TOperation, TOperationData} from './types.ts';

export type IAddControllerToElementOperationData<
  T extends TOperationData = TOperationData,
> = {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @dependency
   */
  controllerInstance: IController<T>;
} & T;

/**
 * This operation adds the specified controller instance to the given selected element.
 *
 */
export const addControllerToElement: TOperation<IAddControllerToElementOperationData> =
  function <T extends TOperationData = TOperationData>(
    this: IOperationScope,
    operationData: IAddControllerToElementOperationData<T>
  ) {
    const {selectedElement, controllerInstance} = operationData;

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
