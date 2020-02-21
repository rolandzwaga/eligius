export function removeElement(operationData, eventBus) {
  const { selectedElement } = operationData;
  selectedElement.remove();
  return operationData;
}

export default removeElement;
