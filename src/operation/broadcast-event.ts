import {removeEventDataFromOperationData} from './helper/remove-event-data-from-operation-data.ts';
import {resolveEventArguments} from './helper/resolve-event-arguments.ts';
import type {TOperation} from './types.ts';

export interface IBroadcastEventOperationData {
  eventArgs: unknown[];
  /**
   * @type=ParameterType:eventTopic
   */
  eventTopic?: string;
  /**
   * @type=ParameterType:eventName
   * @required
   */
  eventName: string;
}

/**
 * This operation broadcasts the given event through the eventbus, along with the
 * event argumetns and optional event topic.
 */
export const broadcastEvent: TOperation<IBroadcastEventOperationData> =
  function (operationData: IBroadcastEventOperationData) {
    const {eventArgs, eventTopic, eventName} = operationData;

    const eventArguments = resolveEventArguments(
      operationData,
      this,
      eventArgs
    );

    if (eventTopic) {
      this.eventbus.broadcastForTopic(eventName, eventTopic, eventArguments);
    } else {
      this.eventbus.broadcast(eventName, eventArguments);
    }

    removeEventDataFromOperationData(operationData);
    return operationData;
  };
