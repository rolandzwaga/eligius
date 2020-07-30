import { getElementControllers } from './getElementData';

function attachControllerToElement(element: JQuery, controller: any) {
  if (!element.data('chronoEngineControllers')) {
    element.data('chronoEngineControllers', []);
  }
  const controllers = getElementControllers(element);
  controllers.push(controller);
}

export default attachControllerToElement;
