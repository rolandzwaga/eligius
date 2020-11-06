import { IToggleClassOperationData } from '../toggle-class';
import { IOperationMetadata } from './types';

function toggleClass(): IOperationMetadata<IToggleClassOperationData> {
  return {
    description: 'Toggles the given class on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: 'ParameterType:className',
        required: true,
      },
    },
  };
}
export default toggleClass;
