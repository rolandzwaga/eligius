import resolvePropertyValues from './helper/resolvePropertyValues';

function setStyle(operationData, eventBus) {
    const properties = resolvePropertyValues(operationData, operationData.properties);
    operationData.selectedElement.css(properties);
    return operationData;
}

export default setStyle;
