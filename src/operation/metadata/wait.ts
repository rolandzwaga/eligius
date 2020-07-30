import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function wait(): IOperationMetadata {
  return {
    description: 'Waits the given amount of milliseconds before the action continues',
    properties: {
      milliseconds: {
        type: ParameterTypes.INTEGER,
        required: true,
      },
    },
  };
}
export default wait;
