import { IOperationMetadata } from './types';
import { IAddClassOperationData } from '../addClass';

function addClass(): IOperationMetadata<IAddClassOperationData> {
  return {
    description: 'Add a class to the selected element.',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: 'ParameterType:className',
        required: true,
      },
    },
  };
}
export default addClass;
