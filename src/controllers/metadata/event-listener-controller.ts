import type { IEventListenerControllerOperationData } from '../event-listener-controller.ts';
import type { IControllerMetadata } from './types.ts';

function EventListenerController(): IControllerMetadata<IEventListenerControllerOperationData> {
  return {
    description: 'EventListenerController',
    dependentProperties: ['selectedElement'],
    properties: {
      eventName: {
        type: 'ParameterType:eventName',
        required: true,
      },
      actions: 'ParameterType:array',
      actionOperationData: 'ParameterType:object',
    },
  };
}

export default EventListenerController;
