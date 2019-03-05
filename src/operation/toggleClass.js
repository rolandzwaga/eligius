function toggleClass(operationData, eventBus) {
    const {selectedElement, className} = operationData;
    selectedElement.toggleClass(className);
    return operationData;
}

export default toggleClass;
