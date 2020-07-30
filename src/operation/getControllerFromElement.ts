import { getElementControllers } from './helper/getElementData';
import { TOperation } from '../action/types';

export interface IGetControllerFromElementOperationData {
  selectedElement: JQuery;
  controllerName: string;
  controllerInstance: any;
}

const getControllerFromElement: TOperation<IGetControllerFromElementOperationData> = function (
  operationData,
  _eventBus
) {
  const { selectedElement, controllerName } = operationData;
  const controllers = getElementControllers(selectedElement);
  const controller = controllers.find((ctrl: any) => {
    return ctrl.name === controllerName;
  });
  if (!controller) {
    console.warn(`controller for name '${controllerName}' was not found on the given element`);
  }
  operationData.controllerInstance = controller;
  return operationData;
};

export default getControllerFromElement;
