import { ISetStyleOperationData } from '../../operation/set-style';
import { IOperationMetadata } from './types';

function setStyle(): IOperationMetadata<ISetStyleOperationData> {
  return {
    description: 'Sets the given style properties on the selected element',
    properties: {
      properties: {
        type: 'ParameterType:object',
        required: true,
      },
      propertyName: {
        type: 'ParameterType:string',
        required: false,
      },
    },
  };
}

export default setStyle;
