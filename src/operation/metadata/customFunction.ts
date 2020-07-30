import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function customFunction(): IOperationMetadata {
  return {
    description: 'Executes the specified custom function',
    properties: {
      systemName: ParameterTypes.SYSTEM_NAME,
    },
  };
}
export default customFunction;
