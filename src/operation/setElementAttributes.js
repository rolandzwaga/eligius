function setElementAttributes(operationData, eventBus) {
    const {attributes, selectedElement} = operationData;
    for (let attrName in attributes) {
        if (attributes.hasOwnProperty(attrName)) {
            selectedElement.attr(attrName, attributes[attrName]);
        }
    }
    return operationData;
}

export default setElementAttributes;
