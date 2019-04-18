function extendController(operationData, eventBus) {
    const { controllerInstance, controllerExtension } = operationData;
    
    operationData.controllerInstance = Object.assign(controllerInstance, controllerExtension);
    
    return operationData;
}

export default extendController;
