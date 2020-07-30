import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function reparentElement(): IOperationMetadata {
  return {
    description: 'Moves the selected element to the new location described by the given selector',
    dependentProperties: ['selectedElement'],
    properties: {
      newParentSelector: {
        type: ParameterTypes.SELECTOR,
        required: true,
      },
    },
  };
}
export default reparentElement;