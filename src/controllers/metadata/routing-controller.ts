import type { IRoutingControllerOperationData } from '../routing-controller.ts';
import type { IControllerMetadata } from './types.ts';

function RoutingController(): IControllerMetadata<IRoutingControllerOperationData> {
  return {
    description: '',
    properties: {
      json: {
        type: 'ParameterType:object',
        required: true,
      },
    },
  };
}

export default RoutingController;
