import { ISetStyleOperationData } from '../setStyle';
import { IOperationMetadata } from './types';

function setStyle(): IOperationMetadata<ISetStyleOperationData> {
  return {
    description: 'Sets the given style properties on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      properties: {
        type: 'ParameterType:object',
        required: true,
      },
    },
  };
}

export default setStyle;
