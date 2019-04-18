function removeEventDataFromOperationData(operationData) {
    delete operationData.eventName;
    delete operationData.eventTopic;
    delete operationData.eventArgs;
}

export default removeEventDataFromOperationData;
