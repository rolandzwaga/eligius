function getControllerInstance(operationData, eventBus) {
    const {systemName} = operationData;
    let {propertyName} = operationData;
    
    propertyName = (propertyName) ? propertyName : "controllerInstance";
    const resultCallback = (instance)=> {
        operationData[propertyName] = instance;
    }
    eventBus.broadcast("request-instance", [systemName, resultCallback]);
    return operationData;
}

export default getControllerInstance;
