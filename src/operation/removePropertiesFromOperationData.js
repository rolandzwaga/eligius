function removePropertiesFromOperationData(operationData, eventBus) {
    const {
        propertyNames
    } = operationData;

    propertyNames.forEach(name => {
        delete operationData[name];
    });
    delete operationData.propertyNames;
    return operationData;
}

export default removePropertiesFromOperationData;