import TimelineEventNames from '../timeline-event-names';
import { TOperation } from '../action/types';

export interface IGetControllerInstanceOperationData {
  systemName: string;
  propertyName?: string;
}

const getControllerInstance: TOperation<IGetControllerInstanceOperationData> = function (operationData, eventBus) {
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

export default getControllerInstance;
