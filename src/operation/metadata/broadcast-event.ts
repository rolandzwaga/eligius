import { IBroadcastEventOperationData } from '../broadcast-event';
import { IOperationMetadata } from './types';

function broadcastEvent(): IOperationMetadata<IBroadcastEventOperationData> {
  return {
    description: 'Broadcasts an eventbus event with the given type, topic and optional arguments',
    properties: {
      eventArgs: 'ParameterType:array',
      eventTopic: 'ParameterType:eventTopic',
      eventName: {
        type: 'ParameterType:eventName',
        required: true,
      },
    },
  };
}
export default broadcastEvent;
