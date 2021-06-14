import { IAnimateOperationData } from '../../operation/animate';
import { IOperationMetadata } from './types';

function animate(): IOperationMetadata<IAnimateOperationData> {
  return {
    description:
      'Animates the selected element with the given animation settings.',
    dependentProperties: ['selectedElement'],
    properties: {
      animationEasing: 'ParameterType:boolean',
      animationProperties: {
        type: 'ParameterType:object',
        required: true,
      },
      animationDuration: {
        type: 'ParameterType:integer',
        required: true,
      },
    },
  };
}
export default animate;
