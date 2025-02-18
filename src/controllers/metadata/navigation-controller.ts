import type { INavigationControllerOperationData } from '../navigation-controller.ts';
import type { IControllerMetadata } from './types.ts';

function NavigationController(): IControllerMetadata<INavigationControllerOperationData> {
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
