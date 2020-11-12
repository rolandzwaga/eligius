import { IToggleElementOperationData } from '~/operation/toggle-element';
import { IOperationMetadata } from './types';

function toggleElement(): IOperationMetadata<IToggleElementOperationData> {
  return {
    description: 'Toggles the selected element',
    dependentProperties: ['selectedElement'],
  };
}
export default toggleElement;
