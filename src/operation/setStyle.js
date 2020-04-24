import resolvePropertyValues from './helper/resolvePropertyValues';

function setStyle(operationData, eventBus) {
  let { propertyName } = operationData;
  if (!propertyName) {
    propertyName = 'selectedElement';
  }
  const properties = resolvePropertyValues(operationData, operationData.properties);
  operationData[propertyName].css(properties);
  return operationData;
}

export default setStyle;
