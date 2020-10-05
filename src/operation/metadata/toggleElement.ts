import { IToggleElementOperationData } from '../toggleElement';
import { IOperationMetadata } from './types';

function toggleElement(): IOperationMetadata<IToggleElementOperationData> {
  return {
    description: 'Toggles the selected element',
    dependentProperties: ['selectedElement'],
  };
}
export default toggleElement;
