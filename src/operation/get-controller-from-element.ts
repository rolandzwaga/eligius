import { IController } from '../controllers/types';
import { getElementControllers } from './helper/get-element-data';
import { TOperation } from './types';

export interface IGetControllerFromElementOperationData {
  selectedElement: JQuery;
  controllerName: string;
  controllerInstance?: IController<any>;
}

export const getControllerFromElement: TOperation<IGetControllerFromElementOperationData> = function(
  operationData: IGetControllerFromElementOperationData
) {
  const { selectedElement, controllerName } = operationData;
  const controllers = getElementControllers(selectedElement);
  const controller = controllers.find(ctrl => {
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
