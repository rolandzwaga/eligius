import * as controllers from '../controllers/index.ts';
import type { IController } from '../controllers/types.ts';
import { TimelineEventNames } from '../timeline-event-names.ts';
import type { TOperation, TOperationData } from './types.ts';

type TSystemName = keyof typeof controllers;
export interface IGetControllerInstanceOperationData {
  /**
   * @required
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
 */
export const getControllerInstance: TOperation<IGetControllerInstanceOperationData> =
  function (operationData: IGetControllerInstanceOperationData) {
    const { systemName } = operationData;

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
