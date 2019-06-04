import ParameterTypes from "./parameterTypes";

function broadcastEvent() {
    return {
        eventArgs: {
            type: ParameterTypes.ARRAY
        },
        eventTopic: {
            type: ParameterTypes.EVENT_TOPIC
        },
        eventName: {
            type: ParameterTypes.EVENT_NAME,
            required: true
        }
    };
}
export default broadcastEvent;