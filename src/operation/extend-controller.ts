import type {IController} from '@controllers/types.ts';
import {isForbiddenPropertyChainSegment} from '@operation/helper/assert-safe-property-chain.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';

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
 *
 * The extension's own properties are copied onto the controller instance.
 *
 * @throws When the extension has a `__proto__`, `prototype` or `constructor` key, which would
 * replace the controller's prototype or shadow its class.
 *
 * @category Controller
 */
export const extendController: TOperation<
  IExtendControllerOperationData,
  Omit<IExtendControllerOperationData, 'controllerExtension'>
> = (operationData: IExtendControllerOperationData) => {
  const {controllerInstance, controllerExtension} = operationData;

  removeProperties(operationData, 'controllerExtension');

  // A JSON-parsed extension can carry an own '__proto__' key; Object.assign would
  // pass it to the '__proto__' setter and swap the controller's prototype.
  const forbiddenKey = Object.keys(controllerExtension ?? {}).find(
    isForbiddenPropertyChainSegment
  );
  if (forbiddenKey !== undefined) {
    throw new Error(
      `extendController: controllerExtension must not contain a '${forbiddenKey}' key`
    );
  }

  operationData.controllerInstance = Object.assign(
    controllerInstance,
    controllerExtension
  );

  return operationData;
};
