import { IOperationMetadata } from './types';

function removeElement(): IOperationMetadata {
  return {
    description: 'Removes the selected element from the DOM',
    dependentProperties: ['selectedElement'],
  };
}
export default removeElement;
