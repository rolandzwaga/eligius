import TimelineEventNames from '../timeline-event-names';

function requestAction(operationData, eventBus) {
        const { systemName } = operationData;

        const resultCallback = (action) => {
            operationData.actionInstance = action;
        };
        eventBus.broadcast(TimelineEventNames.REQUEST_ACTION, [systemName, resultCallback]);
        return operationData;
}

export default requestAction;
