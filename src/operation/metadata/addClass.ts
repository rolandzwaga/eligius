import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';
import { IAddClassOperationData } from '../addClass';

function addClass(): IOperationMetadata<IAddClassOperationData> {
  return {
    description: 'Add a class to the selected element.',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: ParameterTypes.CLASS_NAME,
        required: true,
      },
    },
  };
}
export default addClass;
