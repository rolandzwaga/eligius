import ParameterTypes from "../../operation/metadata/ParameterTypes";

function EventListenerController() {
    return {
        eventName: {
            type: ParameterTypes.EVENT_NAME,
            required: true
        },
        actions: {
            type: ParameterTypes.ARRAY
        },
        actionOperationData: {
            type: ParameterTypes.OBJECT
        }
    }
}

export default EventListenerController;
