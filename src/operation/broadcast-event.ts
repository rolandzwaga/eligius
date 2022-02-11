import { removeEventDataFromOperationData } from './helper/remove-event-data-from-operation-data';
import { resolveEventArguments } from './helper/resolve-event-arguments';
import { TOperation } from './types';

export interface IBroadcastEventOperationData {
  eventArgs: any[];
  eventTopic?: string;
  eventName: string;
}

/**
 * This operation broadcasts the given event through the eventbus, along with the
 * event argumetns and optional event topic.
 *
 * @param operationData
 * @returns
 */
export const broadcastEvent: TOperation<IBroadcastEventOperationData> =
  function (operationData: IBroadcastEventOperationData) {
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
