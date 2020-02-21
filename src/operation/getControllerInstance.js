import TimelineEventNames from '../timeline-event-names';

function getControllerInstance(operationData, eventBus) {
  const { systemName } = operationData;
  let { propertyName } = operationData;

  propertyName = propertyName || 'controllerInstance';
  const resultCallback = instance => {
    operationData[propertyName] = instance;
  };
  eventBus.broadcast(TimelineEventNames.REQUEST_INSTANCE, [systemName, resultCallback]);
  return operationData;
}

export default getControllerInstance;
