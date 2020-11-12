import { IGetControllerFromElementOperationData } from '~/operation/get-controller-from-element';
import { IOperationMetadata } from './types';

function getControllerFromElement(): IOperationMetadata<IGetControllerFromElementOperationData> {
  return {
    description: 'Retrieves the specified controller from the current element',
    dependentProperties: ['selectedElement'],
    properties: {
      controllerName: {
        type: 'ParameterType:controllerName',
        required: true,
      },
    },
    outputProperties: {
      controllerInstance: 'ParameterType:object',
    },
  };
}
export default getControllerFromElement;
