import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function clearOperationData(): IOperationMetadata {
  return {
    description: 'clears the current operation data',
    properties: {
      properties: ParameterTypes.ARRAY,
    },
  };
}
export default clearOperationData;
