import {
  controllersDataName,
  getElementControllers,
} from '@operation/helper/get-element-data.ts';

export function attachControllerToElement(element: JQuery, controller: any) {
  if (!element.data(controllersDataName)) {
    element.data(controllersDataName, []);
  }
  const controllers = getElementControllers(element);
  if (controllers) {
    controllers.push(controller);
  }
}
