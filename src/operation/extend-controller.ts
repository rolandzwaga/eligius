import type {IController} from '../controllers/types.ts';
import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation, TOperationData} from './types.ts';

/**
 * This operation extends the specified controller instance with the specified extension.
 */
export interface IExtendControllerOperationData {
  /**
   * @dependency
   */
  controllerInstance: IController<TOperationData>;
  /**
   * @erased
   * @required
   */
  controllerExtension: Record<PropertyKey, unknown>;
}

/**
 * Extends the current controller with given extension.
 */
export const extendController: TOperation<
  IExtendControllerOperationData,
  Omit<IExtendControllerOperationData, 'controllerExtension'>
> = (operationData: IExtendControllerOperationData) => {
  const {controllerInstance, controllerExtension} = operationData;

  removeProperties(operationData, 'controllerExtension');

  operationData.controllerInstance = Object.assign(
    controllerInstance,
    controllerExtension
  );

  return operationData;
};
