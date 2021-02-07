import { IRoutingControllerOperationData } from '../../controllers/routing-controller';
import { IControllerMetadata } from './types';

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
