import { IClearElementOperationData } from '../clearElement';
import { IOperationMetadata } from './types';

function clearElement(): IOperationMetadata<IClearElementOperationData> {
  return {
    description: 'clears the given element',
    dependentProperties: ['selectedElement'],
  };
}

export default clearElement;
