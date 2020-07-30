import { TOperation } from '../action/types';

export interface IExtendControllerOperationData {
  controllerInstance: any;
  controllerExtension: any;
}

const extendController: TOperation<IExtendControllerOperationData> = function (operationData, _eventBus) {
  const { controllerInstance, controllerExtension } = operationData;

  operationData.controllerInstance = Object.assign(controllerInstance, controllerExtension);

  return operationData;
};

export default extendController;
