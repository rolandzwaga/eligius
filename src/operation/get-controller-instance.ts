import * as controllers from '../controllers';
import { IController } from '../controllers/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

type TSystemName = keyof typeof controllers;
export interface IGetControllerInstanceOperationData {
  systemName: TSystemName;
  propertyName?: string;
  controllerInstance?: IController<unknown>;
}

/**
 * This operation retrieves an instance of the given controller name.
 * It assigns this instance to the property on the current operation data
 * defined by the propertyName property which defaults to 'controllerInstance'.
 *
 * @param operationData
 * @returns
 */
export const getControllerInstance: TOperation<IGetControllerInstanceOperationData> =
  function (operationData: IGetControllerInstanceOperationData) {
    const { systemName, propertyName = 'controllerInstance' } = operationData;

    (operationData as any)[propertyName] = null;
    const resultCallback = (instance: any) => {
      (operationData as any)[propertyName as string] = instance;
    };
    this.eventbus.broadcast(TimelineEventNames.REQUEST_INSTANCE, [
      systemName,
      resultCallback,
    ]);
    delete operationData.propertyName;
    return operationData;
  };
