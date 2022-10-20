import { getElementControllers } from './get-element-data';

export function attachControllerToElement(element: JQuery, controller: any) {
  if (!element.data('eligiusEngineControllers')) {
    element.data('eligiusEngineControllers', []);
  }
  const controllers = getElementControllers(element);
  controllers.push(controller);
}
