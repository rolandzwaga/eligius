function reparentElement(operationData, eventBus) {
    const {selectedElement, newParentSelector} = operationData;
    selectedElement.remove().appendTo(newParentSelector);
}

export default reparentElement;
