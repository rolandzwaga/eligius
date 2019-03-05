function clearElement(operationData, eventBus) {
    const {selectedElement} = operationData;
    selectedElement.empty();
    return operationData;
}

export default clearElement;
