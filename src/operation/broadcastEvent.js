import resolveEventArguments from './helper/resolveEventArguments';
import removeEventDataFromOperationData from './helper/removeEventDataFromOperationData';

function broadcastEvent(operationData, eventBus) {
  const { eventArgs, eventTopic, eventName } = operationData;

  const eventArguments = resolveEventArguments(operationData, eventArgs);

  if (eventTopic) {
    eventBus.broadcastForTopic(eventName, eventTopic, eventArguments);
  } else {
    eventBus.broadcast(eventName, eventArguments);
  }

  removeEventDataFromOperationData(operationData);
  return operationData;
}

export default broadcastEvent;
