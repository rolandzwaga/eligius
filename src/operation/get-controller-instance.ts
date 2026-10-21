import type * as controllers from '@controllers/index.ts';
import type {IController} from '@controllers/types.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {requestNamedEntry} from '@operation/helper/request-registered-entry.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';

type TSystemName = keyof typeof controllers;
export interface IGetControllerInstanceOperationData {
  /**
   * @required
   * @erased
   */
  systemName: TSystemName;
  /**
   * @type=ParameterType:object
   * @output
   */
  controllerInstance?: IController<TOperationData>;
}

/**
 * This operation retrieves an instance of the given controller name.
 * It assigns this instance to the `controllerInstance` property on the current operation data
 *
 * @throws Error naming getControllerInstance and the `systemName` when no controller is
 * registered under that name, or when creating it fails (for example because the name
 * belongs to something that is not a controller class). The importer's "did you mean"
 * hint is kept in the message and the original error is the `cause`.
 *
 * @category Controller
 */
export const getControllerInstance: TOperation<
  IGetControllerInstanceOperationData,
  Omit<IGetControllerInstanceOperationData, 'systemName'>
> = function (operationData: IGetControllerInstanceOperationData) {
  const {systemName} = operationData;

  removeProperties(operationData, 'systemName');

  operationData.controllerInstance = requestNamedEntry(
    this.eventbus,
    'request-instance',
    'getControllerInstance',
    systemName,
    'controller'
  ) as IController<TOperationData>;

  return operationData;
};
