function log(operationData, eventBus) {
  console.dir(this);
  console.dir(operationData);
  return operationData;
}

export default log;
