import resolvePropertyValues from './helper/resolvePropertyValues';

function setOperationData(operationData, eventBus) {
    const properties = resolvePropertyValues(operationData, operationData.properties);
    operationData = Object.assign(operationData, properties);
    delete operationData.properties;
    return operationData;
}

export default setOperationData;
