import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function startLoop(): IOperationMetadata {
  return {
    description: 'Starts a loop over the given collection',
    properties: {
      collection: {
        type: ParameterTypes.ARRAY,
        required: true,
      },
      propertyName: {
        type: ParameterTypes.STRING,
        defaultValue: 'currentItem',
      },
    },
  };
}

export default startLoop;
