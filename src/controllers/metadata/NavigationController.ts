import { INavigationControllerOperationData } from '../../controllers/navigation-controller';
import { IControllerMetadata } from './types';

function NavigationController(): IControllerMetadata<
  INavigationControllerOperationData
> {
  return {
    description: '',
    dependentProperties: ['selectedElement'],
    properties: {
      json: {
        type: 'ParameterType:object',
        required: true,
      },
    },
  };
}

export default NavigationController;
