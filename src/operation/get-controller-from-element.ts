import type { IController } from '../controllers/types.ts';
import { getElementControllers } from './helper/get-element-data.ts';
import type { TOperation } from './types.ts';

export interface IGetControllerFromElementOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:controllerName
   * @required
   */
  controllerName: string;
  /**
   * @type=ParameterType:object
   * @output
   */  
  controllerInstance?: IController<any>;
}

/**
 * This operation retrieves the controller instance with the specified name that is assigned to the given selected element.
 *
 * @param operationData
 * @returns
 */
export const getControllerFromElement: TOperation<IGetControllerFromElementOperationData> =
  function (operationData: IGetControllerFromElementOperationData) {
    const { selectedElement, controllerName } = operationData;
    const controllers = getElementControllers(selectedElement);
    const controller = controllers?.find((ctrl) => {
      return ctrl.name === controllerName;
    });

    if (!controller) {
      console.warn(
        `controller for name '${controllerName}' was not found on the given element`
      );
    }

    operationData.controllerInstance = controller;
    return operationData;
  };
