import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';
import { IAddControllerToElementOperationData } from '../addControllerToElement';

function addGlobalsToOperation(): IOperationMetadata<IAddControllerToElementOperationData> {
  return {
    description: 'Add global properties to the current operation data.',
    dependentProperties: ['selectedElement'],
    properties: {
      globalProperties: {
        type: ParameterTypes.ARRAY,
        required: true,
      },
    },
  };
}
export default addGlobalsToOperation;
