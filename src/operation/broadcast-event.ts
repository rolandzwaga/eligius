import { TOperation } from '../action/types';
import removeEventDataFromOperationData from './helper/remove-event-data-from-operation-data';
import resolveEventArguments from './helper/resolve-event-arguments';

export interface IBroadcastEventOperationData {
  eventArgs: any;
  eventTopic?: string;
  eventName: string;
}

const broadcastEvent: TOperation<IBroadcastEventOperationData> = function (operationData, eventBus) {
  const { eventArgs, eventTopic, eventName } = operationData;

  const eventArguments = resolveEventArguments(operationData, eventArgs);

  if (eventTopic) {
    eventBus.broadcastForTopic(eventName, eventTopic, eventArguments);
  } else {
    eventBus.broadcast(eventName, eventArguments);
  }

  removeEventDataFromOperationData(operationData);
  return operationData;
};

export default broadcastEvent;
