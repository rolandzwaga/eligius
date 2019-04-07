import { getElementControllers } from './getElementData';

function attachControllerToElement(element, controller) {
    if (!element.data('chronoEngineControllers')) {
        element.data('chronoEngineControllers', []);
    }
    const controllers = getElementControllers(element);
    controllers.push(controller);
}

export default attachControllerToElement;
