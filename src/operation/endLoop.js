function endLoop(operationData, eventBus) {
  const context = this;
  if (context.loopIndex < context.loopLength) {
    context.loopIndex = context.loopIndex + 1;
    context.currentIndex = context.startIndex;
  } else {
    delete context.loopIndex;
    delete context.loopLength;
    delete context.startIndex;
  }
  return operationData;
}
