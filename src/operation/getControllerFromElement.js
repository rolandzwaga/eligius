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
    operationData.controllerInstance = controller;
    return operationData;
}

export default getControllerFromElement;
