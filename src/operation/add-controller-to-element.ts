import type {IController} from '@controllers/types.ts';
import {attachControllerToElement} from '@operation/helper/attach-controller-to-element.ts';
import {getElementControllers} from '@operation/helper/get-element-data.ts';
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

function unregisterController(
  element: JQuery,
  controller: IController<any>
): void {
  const controllers = getElementControllers(element);
  const index = controllers?.indexOf(controller) ?? -1;
  if (index > -1) {
    controllers?.splice(index, 1);
  }
}

/**
 * This operation adds the specified controller instance to the given selected element.
 *
 * The controller is registered on the element only once `init` and a synchronous `attach`
 * have succeeded. When `attach` returns a promise, the controller is registered before
 * that promise settles (so detaching the element can still reach it) and is removed from
 * the element again when the promise rejects.
 *
 * @throws When the controller's `init` or `attach` throws, or the promise returned by `attach` rejects.
 *
 * @category Controller
 */
export const addControllerToElement: TOperation<IAddControllerToElementOperationData> =
  function <T extends TOperationData = TOperationData>(
    this: IOperationScope,
    operationData: IAddControllerToElementOperationData<T>
  ) {
    const {selectedElement, controllerInstance} = operationData;

    controllerInstance.init(operationData);

    const promise = controllerInstance.attach(this.eventbus);

    attachControllerToElement(selectedElement, controllerInstance);

    if (promise) {
      return new Promise((resolve, reject) => {
        promise.then(
          (newOperationData: TOperationData) => {
            internalResolve(resolve, operationData, newOperationData);
          },
          (error: unknown) => {
            unregisterController(selectedElement, controllerInstance);
            reject(error);
          }
        );
      });
    } else {
      return operationData;
    }
  };
