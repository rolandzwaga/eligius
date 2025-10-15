import type {IController} from '../controllers/types.ts';
import type {TOperation, TOperationData} from './types.ts';

/**
 * This operation extends the specified controller instance with the specified extension.
 */
export interface IExtendControllerOperationData {
  /**
   * @dependency
   */
  controllerInstance: IController<TOperationData>;
  controllerExtension: Record<PropertyKey, unknown>;
}

/**
 * Extends the current controller with given extension.
 */
export const extendController: TOperation<IExtendControllerOperationData> = (
  operationData: IExtendControllerOperationData
) => {
  const {controllerInstance, controllerExtension} = operationData;

  operationData.controllerInstance = Object.assign(
    controllerInstance,
    controllerExtension
  );

  return operationData;
};
