function setElementAttributes(operationData, eventBus) {
    const {attributes, selectedElement} = operationData;
    Object.keys(attributes).forEach(attrName => {
        selectedElement.attr(attrName, attributes[attrName]);
    });
    return operationData;
}

export default setElementAttributes;
