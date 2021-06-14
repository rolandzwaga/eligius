import { IController } from '../controllers/types';
import { TOperation } from './types';

export interface IExtendControllerOperationData {
  controllerInstance: IController<any>;
  controllerExtension: any;
}

export const extendController: TOperation<IExtendControllerOperationData> = function(
  operationData: IExtendControllerOperationData
) {
  const { controllerInstance, controllerExtension } = operationData;

  operationData.controllerInstance = Object.assign(
    controllerInstance,
    controllerExtension
  );

  return operationData;
};
