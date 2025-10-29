import type * as controllers from '../controllers/index.ts';
import type {IController} from '../controllers/types.ts';
import {TimelineEventNames} from '../timeline-event-names.ts';
import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation, TOperationData} from './types.ts';

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
 * @category Controller
 */
export const getControllerInstance: TOperation<
  IGetControllerInstanceOperationData,
  Omit<IGetControllerInstanceOperationData, 'systemName'>
> = function (operationData: IGetControllerInstanceOperationData) {
  const {systemName} = operationData;

  removeProperties(operationData, 'systemName');

  operationData.controllerInstance = undefined;
  const resultCallback = (instance: IController<TOperationData>) => {
    operationData.controllerInstance = instance;
  };
  this.eventbus.broadcast(TimelineEventNames.REQUEST_INSTANCE, [
    systemName,
    resultCallback,
  ]);
  return operationData;
};
