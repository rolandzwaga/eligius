import TimelineEventNames from '../timeline-event-names';

function requestAction(operationData, eventBus) {
        const { actionName } = operationData;

        const resultCallback = (action) => {
            operationData.actionInstance = action;
        };
        eventBus.broadcast(TimelineEventNames.REQUEST_ACTION, [actionName, resultCallback]);
        return operationData;
}

export default requestAction;
