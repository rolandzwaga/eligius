import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function setElementAttributes(): IOperationMetadata {
  return {
    description: 'Sets the given attributes on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      attributes: {
        type: ParameterTypes.OBJECT,
        required: true,
      },
    },
  };
}
export default setElementAttributes;