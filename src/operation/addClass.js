function addClass(operationData, eventBus) {
    const {selectedElement, className} = operationData;
    selectedElement.addClass(className);
    return operationData;
}

export default addClass;
