import {getElementControllers} from './helper/getElementData';

function removeControllerFromElement(operationData, eventBus) {
    const {selectedElement, controllerName} = operationData;

    const controllers = getElementControllers(selectedElement);
    if (controllers) {
        let controller = null;
        controllers.some((ctrl) => {
            if (ctrl.name === controllerName) {
                controller = ctrl;
                return true;
            }
            return false;
        });
        if (controller) {
            const idx = controllers.indexOf(controller);
            if (idx > -1) {
                controllers.splice(idx, 1);
            }
            controller.detach(eventBus);
        }
    }
    return operationData;
}

export default removeControllerFromElement;
