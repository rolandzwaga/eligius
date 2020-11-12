import { IRemoveElementOperationData } from '~/operation/remove-element';
import { IOperationMetadata } from './types';

function removeElement(): IOperationMetadata<IRemoveElementOperationData> {
  return {
    description: 'Removes the selected element from the DOM',
    dependentProperties: ['selectedElement'],
  };
}
export default removeElement;
