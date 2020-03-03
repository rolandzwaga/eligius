function logOperation(operationData, eventBus) {
  console.dir(this);
  console.dir(operationData);
  return operationData;
}

export default logOperation;
