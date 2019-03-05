export function removeElement(operationData, eventBus) {
    operationData.selectedElement.remove();
    return operationData;
}

export default removeElement;
