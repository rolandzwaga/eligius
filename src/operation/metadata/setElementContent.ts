import { ISetElementContentOperationData } from '../setElementContent';
import { IOperationMetadata } from './types';

function setElementContent(): IOperationMetadata<ISetElementContentOperationData> {
  return {
    description: 'Sets the given HTML content in the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      append: 'ParameterType:boolean',
      template: {
        type: 'ParameterType:htmlContent',
        required: true,
      },
    },
  };
}
export default setElementContent;
