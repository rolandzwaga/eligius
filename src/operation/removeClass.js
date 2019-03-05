function removeClass(operationData, eventBus) {
    const {selectedElement, className} = operationData;
    selectedElement.removeClass(className);
    return operationData;
}

export default removeClass;
