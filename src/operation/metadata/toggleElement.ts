import { IOperationMetadata } from './types';

function toggleElement(): IOperationMetadata {
  return {
    description: 'Toggles the selected element',
    dependentProperties: ['selectedElement'],
  };
}
export default toggleElement;
