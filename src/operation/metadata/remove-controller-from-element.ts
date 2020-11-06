import { IRemoveControllerFromElementOperationData } from '../remove-controller-from-element';
import { IOperationMetadata } from './types';

function removeControllerFromElement(): IOperationMetadata<IRemoveControllerFromElementOperationData> {
  return {
    description: 'Removes the specified controller from the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      controllerName: {
        type: 'ParameterType:controllerName',
        required: true,
      },
    },
  };
}

export default removeControllerFromElement;
