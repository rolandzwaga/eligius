function endLoop(operationData, eventBus) {
  const context = this;
  if (!context.skip) {
    if (context.loopIndex < context.loopLength) {
      context.loopIndex = context.loopIndex + 1;
      context.newIndex = context.startIndex;
    } else {
      delete context.loopIndex;
      delete context.loopLength;
      delete context.startIndex;
      delete context.newIndex;
    }
  } else {
    delete context.skip;
  }
  return operationData;
}

export default endLoop;