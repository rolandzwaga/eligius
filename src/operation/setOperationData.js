import resolvePropertyValues from './helper/resolvePropertyValues';

function setOperationData(operationData, eventBus) {
  const { override, properties } = operationData;
  const resolvedProperties = resolvePropertyValues(operationData, properties);
  if (override) {
    operationData = resolvedProperties;
  } else {
    operationData = Object.assign(operationData, resolvedProperties);
  }
  delete operationData.properties;
  return operationData;
}

export default setOperationData;
