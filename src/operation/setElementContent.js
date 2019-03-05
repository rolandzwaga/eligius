function setElementContent(operationData, eventBus) {
    const {append, selectedElement, template} = operationData;
    if (!append) {
        selectedElement.html(template);
    } else {
        selectedElement.append(template);
    }
    return operationData;
}

export default setElementContent;
