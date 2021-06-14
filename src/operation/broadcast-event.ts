import { removeEventDataFromOperationData } from './helper/remove-event-data-from-operation-data';
import { resolveEventArguments } from './helper/resolve-event-arguments';
import { TOperation } from './types';

export interface IBroadcastEventOperationData {
  eventArgs: any[];
  eventTopic?: string;
  eventName: string;
}

export const broadcastEvent: TOperation<IBroadcastEventOperationData> = function(
  operationData: IBroadcastEventOperationData
) {
  const { eventArgs, eventTopic, eventName } = operationData;

  const eventArguments = resolveEventArguments(operationData, eventArgs);

  if (eventTopic) {
    this.eventbus.broadcastForTopic(eventName, eventTopic, eventArguments);
  } else {
    this.eventbus.broadcast(eventName, eventArguments);
  }

  removeEventDataFromOperationData(operationData);
  return operationData;
};
