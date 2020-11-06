import { ISetElementAttributesOperationData } from '../set-element-attributes';
import { IOperationMetadata } from './types';

function setElementAttributes(): IOperationMetadata<ISetElementAttributesOperationData> {
  return {
    description: 'Sets the given attributes on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      attributes: {
        type: 'ParameterType:object',
        required: true,
      },
    },
  };
}
export default setElementAttributes;
