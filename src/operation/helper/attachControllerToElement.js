import { getElementControllers } from './getElementData';

function attachControllerToElement(element, controller) {
    if (!element.data("ivpControllers")) {
        element.data("ivpControllers", []);
    }
    const controllers = getElementControllers(element);
    controllers.push(controller);
}

export default attachControllerToElement;
