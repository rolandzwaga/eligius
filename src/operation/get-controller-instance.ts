import * as controllers from '../controllers';
import { IController } from '../controllers/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

type TSystemName = keyof typeof controllers;
export interface IGetControllerInstanceOperationData {
  systemName: TSystemName;
  controllerInstance?: IController<unknown>;
}

/**
 * This operation retrieves an instance of the given controller name.
 * It assigns this instance to the `controllerInstance` property on the current operation data
 *
 * @param operationData
 * @returns
 */
export const getControllerInstance: TOperation<IGetControllerInstanceOperationData> =
  function (operationData: IGetControllerInstanceOperationData) {
    const { systemName } = operationData;

    operationData.controllerInstance = undefined;
    const resultCallback = (instance: IController<unknown>) => {
      operationData.controllerInstance = instance;
    };
    this.eventbus.broadcast(TimelineEventNames.REQUEST_INSTANCE, [
      systemName,
      resultCallback,
    ]);
    return operationData;
  };
