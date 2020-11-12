import { IAddClassOperationData } from '~/operation/add-class';
import { IOperationMetadata } from './types';

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
