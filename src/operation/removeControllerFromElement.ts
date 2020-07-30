import { getElementControllers } from './helper/getElementData';
import { TOperation } from '../action/types';

export interface IRemoveControllerFromElementOperationData {
  selectedElement: JQuery;
  controllerName: string;
}

const removeControllerFromElement: TOperation<IRemoveControllerFromElementOperationData> = function (
  operationData,
  eventBus
) {
  const { selectedElement, controllerName } = operationData;

  const controllers = getElementControllers(selectedElement);
  if (controllers) {
    let controller: any = null;
    controllers.some((ctrl: any) => {
      if (ctrl.name === controllerName) {
        controller = ctrl;
        return true;
      }
      return false;
    });
    if (controller) {
      const idx = controllers.indexOf(controller);
      controllers.splice(idx, 1);
      controller.detach(eventBus);
    }
  }
  return operationData;
};

export default removeControllerFromElement;
