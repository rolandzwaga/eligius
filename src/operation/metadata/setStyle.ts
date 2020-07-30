import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function setStyle(): IOperationMetadata {
  return {
    description: 'Sets the given style properties on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      properties: {
        type: ParameterTypes.OBJECT,
        required: true,
      },
    },
  };
}

export default setStyle;
