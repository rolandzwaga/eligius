import { IProgressbarControllerOperationData } from '../../controllers/progressbar-controller';
import { IControllerMetadata } from './types';

function ProgressbarController(): IControllerMetadata<
  IProgressbarControllerOperationData
> {
  return {
    description: 'ProgressbarController',
    dependentProperties: ['selectedElement', 'textElement'],
  };
}

export default ProgressbarController;
