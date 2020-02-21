import ParameterTypes from './ParameterTypes';

function broadcastEvent() {
  return {
    description: 'Broadcasts an eventbus event with the given type, topic and optional arguments',
    properties: {
      eventArgs: ParameterTypes.ARRAY,
      eventTopic: ParameterTypes.EVENT_TOPIC,
      eventName: {
        type: ParameterTypes.EVENT_NAME,
        required: true,
      },
    },
  };
}
export default broadcastEvent;
