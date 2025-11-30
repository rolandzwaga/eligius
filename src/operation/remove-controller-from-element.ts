import type {IController} from '@controllers/types.ts';
import {getElementControllers} from '@operation/helper/get-element-data.ts';
import type {TOperation} from '@operation/types.ts';

export interface IRemoveControllerFromElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:controllerName
   * @required
   * @erased
   */
  controllerName: string;
}

/**
 * This operation removes the controller with the specified name from the given selected element.
 *
 * @param operationData
 * @returns
 *
 * @category Controller
 */
export const removeControllerFromElement: TOperation<
  IRemoveControllerFromElementOperationData,
  Omit<IRemoveControllerFromElementOperationData, 'controllerName'>
> = function (operationData: IRemoveControllerFromElementOperationData) {
  const {selectedElement, controllerName} = operationData;

  delete (operationData as any).controllerName;

  const controllers = getElementControllers(selectedElement);
  const controller = controllers?.find(
    (ctrl: IController<any>) => ctrl.name === controllerName
  );

  if (controller && controllers) {
    const idx = controllers.indexOf(controller);
    controllers.splice(idx, 1);
    controller.detach(this.eventbus);
  } else {
    console.warn(
      `controller for name '${controllerName}' was not found on the given element`
    );
  }

  return operationData;
};
