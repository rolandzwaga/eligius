import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function extendController(): IOperationMetadata {
  return {
    description: 'Extends the current controller',
    dependentProperties: ['controllerInstance'],
    properties: {
      controllerExtension: ParameterTypes.OBJECT,
    },
  };
}
export default extendController;
