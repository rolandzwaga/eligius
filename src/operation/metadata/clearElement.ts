import { IOperationMetadata } from './types';

function clearElement(): IOperationMetadata {
  return {
    description: 'clears the given element',
    dependentProperties: ['selectedElement'],
  };
}

export default clearElement;
