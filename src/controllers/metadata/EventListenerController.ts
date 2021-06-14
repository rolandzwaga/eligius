import { IEventListenerControllerOperationData } from '../../controllers/event-listener-controller';
import { IControllerMetadata } from './types';

function EventListenerController(): IControllerMetadata<
  IEventListenerControllerOperationData
> {
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
