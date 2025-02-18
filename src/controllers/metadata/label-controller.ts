import type { ILabelControllerMetadata } from '../label-controller.ts';
import type { IControllerMetadata } from './types.ts';

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
