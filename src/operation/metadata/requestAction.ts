import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function requestAction(): IOperationMetadata {
  return {
    description: 'Retrieves an instance of the specified action',
    properties: {
      systemName: {
        type: ParameterTypes.ACTION_NAME,
      },
    },
    outputProperties: {
      actionInstance: ParameterTypes.OBJECT,
    },
  };
}
export default requestAction;
