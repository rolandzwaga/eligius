import { IController } from '../controllers/types';
import { getElementControllers } from './helper/get-element-data';
import { TOperation } from './types';

export interface IRemoveControllerFromElementOperationData {
  selectedElement: JQuery;
  controllerName: string;
}

export const removeControllerFromElement: TOperation<IRemoveControllerFromElementOperationData> = function(
  operationData: IRemoveControllerFromElementOperationData
) {
  const { selectedElement, controllerName } = operationData;

  const controllers = getElementControllers(selectedElement);
  const controller = controllers?.find(
    (ctrl: IController<any>) => ctrl.name === controllerName
  );

  if (controller) {
    const idx = controllers.indexOf(controller);
    controllers.splice(idx, 1);
    controller.detach(this.eventbus);
  }

  return operationData;
};
