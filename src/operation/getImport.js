import TimelineEventNames from '../timeline-event-names';

function getImport(operationData, eventBus) {
    const { systemName } = operationData;
    const callBack = instance => {
        operationData.importedInstance = instance;
    };
    eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [systemName, callBack]);
    delete operationData.systemName;
    return operationData;
}

export default getImport;
