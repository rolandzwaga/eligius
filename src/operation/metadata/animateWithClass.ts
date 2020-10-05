import { IOperationMetadata } from './types';
import { IAnimateWithClassOperationData } from '../animateWithClass';

function animateWithClass(): IOperationMetadata<IAnimateWithClassOperationData> {
  return {
    description: 'Animates the selected element by adding the given animation class.',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: 'ParameterType:className',
        required: true,
      },
      removeClass: 'ParameterType:boolean',
    },
  };
}
export default animateWithClass;
