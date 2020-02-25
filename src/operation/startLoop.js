function startLoop(operationData, eventBus) {
  const context = this;
  const { collection, propertyName } = operationData;
  if (!context.loopIndex) {
    context.loopIndex = 0;
    context.loopLength = collection.length;
    context.startIndex = index.currentIndex;
  }
  operationData[propertyName] = collection[context.loopIndex];
  return operationData;
}
