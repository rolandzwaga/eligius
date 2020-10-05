import { ILabelControllerMetadata } from '../LabelController';
import { IControllerMetadata } from './types';

function LabelController(): IControllerMetadata<ILabelControllerMetadata> {
  return {
    description: 'LabelController',
    properties: {
      labelId: 'ParameterType:labelId',
    },
    dependentProperties: ['selectedElement'],
  };
}

export default LabelController;
