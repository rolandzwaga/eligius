import type { IProgressbarControllerOperationData } from '../progressbar-controller.ts';
import type { IControllerMetadata } from './types.ts';

function ProgressbarController(): IControllerMetadata<IProgressbarControllerOperationData> {
  return {
    description: 'ProgressbarController',
    dependentProperties: ['selectedElement', 'textElement'],
  };
}

export default ProgressbarController;
