import * as controllers from '~/controllers';
import { IEventbus } from '~/eventbus/types';
import { TimelineEventNames } from '~/timeline-event-names';
import { TOperation } from './types';

type TSystemName = keyof typeof controllers;
export interface IGetControllerInstanceOperationData {
  systemName: TSystemName;
  propertyName?: string;
}

export const getControllerInstance: TOperation<IGetControllerInstanceOperationData> = function (
  operationData: IGetControllerInstanceOperationData,
  eventBus: IEventbus
) {
  const { systemName, propertyName = 'controllerInstance' } = operationData;

  (operationData as any)[propertyName] = null;
  const resultCallback = (instance: any) => {
    (operationData as any)[propertyName as string] = instance;
  };
  eventBus.broadcast(TimelineEventNames.REQUEST_INSTANCE, [systemName, resultCallback]);
  delete operationData.propertyName;
  return operationData;
};
