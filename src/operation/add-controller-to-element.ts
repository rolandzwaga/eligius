import type {IController} from '@controllers/types.ts';
import {attachControllerToElement} from '@operation/helper/attach-controller-to-element.ts';
import {internalResolve} from '@operation/helper/internal-resolve.ts';
import type {
  IOperationScope,
  TOperation,
  TOperationData,
} from '@operation/types.ts';

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
 * @category Controller
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
