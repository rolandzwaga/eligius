import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function getControllerFromElement(): IOperationMetadata {
  return {
    description: 'Retrieves the specified controller from the current element',
    dependentProperties: ['selectedElement'],
    properties: {
      controllerName: {
        type: ParameterTypes.CONTROLLER_NAME,
        required: true,
      },
    },
    outputProperties: {
      controllerInstance: ParameterTypes.OBJECT,
    },
  };
}
export default getControllerFromElement;
