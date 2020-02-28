import { getElementControllers } from './helper/getElementData';

function getControllerFromElement(operationData, eventBus) {
  const { selectedElement, controllerName } = operationData;
  const controllers = getElementControllers(selectedElement);
  const controller = controllers.find(ctrl => {
    return ctrl.name === controllerName;
  });
  if (!controller) {
    console.warn(`controller for name '${controllerName}' was not found on the given element`);
  }
  operationData.controllerInstance = controller;
  return operationData;
}

export default getControllerFromElement;
