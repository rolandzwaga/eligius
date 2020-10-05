import { IProgressbarControllerOperationData } from '../ProgressbarController';
import { IControllerMetadata } from './types';

function ProgressbarController(): IControllerMetadata<IProgressbarControllerOperationData> {
  return {
    description: 'ProgressbarController',
    dependentProperties: ['selectedElement', 'textElement'],
  };
}

export default ProgressbarController;
