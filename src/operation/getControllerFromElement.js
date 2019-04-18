import { getElementControllers } from './helper/getElementData';

function getControllerFromElement(operationData, eventBus) {
    const {selectedElement, controllerName} = operationData;
    const controllers = getElementControllers(selectedElement);
    let controller = null;
    controllers.some((ctrl) => {
        if (ctrl.name === controllerName) {
            controller = ctrl;
            return true;
        }
        return false;
    });
    if (!controller) {
        console.warn(`controller for name '${controllerName}' was not found on the given element`);
    }
    operationData.controllerInstance = controller;
    return operationData;
}

export default getControllerFromElement;
