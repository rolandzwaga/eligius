import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function removeControllerFromElement(): IOperationMetadata {
  return {
    description: 'Removes the specified controller from the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      controllerName: {
        type: ParameterTypes.CONTROLLER_NAME,
        required: true,
      },
    },
  };
}

export default removeControllerFromElement;
