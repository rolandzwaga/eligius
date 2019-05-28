import TimelineEventNames from '../timeline-event-names';

function getImport(operationData, eventBus) {
    const callBack = instance => {
        operationData.importedInstance = instance;
    };
    eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [operationData.systemName, callBack]);
    delete operationData.systemName;
    return operationData;
}

export default getImport;
