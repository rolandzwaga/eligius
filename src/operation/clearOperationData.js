function clearOperationData(operationData, eventBus) {
  const { properties } = operationData;
  if (properties) {
    properties.forEach(name => {
      delete operationData[name];
    });
    delete operationData.properties;
    return operationData;
  }
  return {};
}

export default clearOperationData;
