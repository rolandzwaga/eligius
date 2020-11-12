import { IReparentElementOperationData } from '~/operation/reparent-element';
import { IOperationMetadata } from './types';

function reparentElement(): IOperationMetadata<IReparentElementOperationData> {
  return {
    description: 'Moves the selected element to the new location described by the given selector',
    dependentProperties: ['selectedElement'],
    properties: {
      newParentSelector: {
        type: 'ParameterType:selector',
        required: true,
      },
    },
  };
}
export default reparentElement;
