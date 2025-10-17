import {resolveEventArguments} from './helper/resolve-event-arguments.ts';
import type {TOperation} from './types.ts';

export interface IBroadcastEventOperationData {
  /**
   * @required
   * @erased
   */
  eventArgs: unknown[];
  /**
   * @type=ParameterType:eventTopic
   * @erased
   */
  eventTopic?: string;
  /**
   * @type=ParameterType:eventName
   * @required
   * @erased
   */
  eventName: string;
}

/**
 * This operation broadcasts the given event through the eventbus, along with the
 * event arguments and optional event topic.
 */
export const broadcastEvent: TOperation<IBroadcastEventOperationData> =
  function (operationData: IBroadcastEventOperationData) {
    const {eventArgs, eventTopic, eventName} = operationData;

    delete (operationData as any).eventArgs;
    delete (operationData as any).eventTopic;
    delete (operationData as any).eventName;

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

    return operationData;
  };
