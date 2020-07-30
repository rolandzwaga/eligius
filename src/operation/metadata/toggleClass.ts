import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function toggleClass(): IOperationMetadata {
  return {
    description: 'Toggles the given class on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: ParameterTypes.CLASS_NAME,
        required: true,
      },
    },
  };
}
export default toggleClass;
