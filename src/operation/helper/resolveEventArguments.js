import extractOperationDataArgumentValues from './extractOperationDataArgumentValues';

function resolveEventArguments(operationData, eventArgs) {
    if (!eventArgs) {
        return;
    }
    const extract = extractOperationDataArgumentValues.bind(null, operationData);
    return eventArgs.map(extract);
}

export default resolveEventArguments;
