import { IEventbus } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

export interface IGetControllerInstanceOperationData {
  systemName: string;
  propertyName?: string;
}

export const getControllerInstance: TOperation<IGetControllerInstanceOperationData> = function (
  operationData: IGetControllerInstanceOperationData,
  eventBus: IEventbus
) {
  const { systemName } = operationData;
  let { propertyName } = operationData;

  propertyName = propertyName || 'controllerInstance';
  (operationData as any)[propertyName] = null;
  const resultCallback = (instance: any) => {
    (operationData as any)[propertyName as string] = instance;
  };
  eventBus.broadcast(TimelineEventNames.REQUEST_INSTANCE, [systemName, resultCallback]);
  return operationData;
};
