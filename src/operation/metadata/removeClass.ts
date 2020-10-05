import { IRemoveClassOperationData } from '../removeClass';
import { IOperationMetadata } from './types';

function removeClass(): IOperationMetadata<IRemoveClassOperationData> {
  return {
    description: 'Removes the specified class from the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: 'ParameterType:className',
        required: true,
      },
    },
  };
}

export default removeClass;
