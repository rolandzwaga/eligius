function removeEventDataFromOperationData(operationData) {
    delete operationData.eventName;
    delete operationData.eventTopic;
    delete operationData.eventArgs;
    delete operationData.promiseResultName;
}

export default removeEventDataFromOperationData;
