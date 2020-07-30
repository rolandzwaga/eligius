import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function removeClass(): IOperationMetadata {
  return {
    description: 'Removes the specified class from the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: ParameterTypes.CLASS_NAME,
        required: true,
      },
    },
  };
}

export default removeClass;
