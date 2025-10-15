import type {IController} from '../controllers/types.ts';
import {getElementControllers} from './helper/get-element-data.ts';
import type {TOperation} from './types.ts';

export interface IRemoveControllerFromElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:controllerName
   */
  controllerName: string;
}

/**
 * This operation removes the controller with the specified name from the given selected element.
 *
 * @param operationData
 * @returns
 */
export const removeControllerFromElement: TOperation<IRemoveControllerFromElementOperationData> =
  function (operationData: IRemoveControllerFromElementOperationData) {
    const {selectedElement, controllerName} = operationData;

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
