import { IWaitOperationData } from '../../operation/wait';
import { IOperationMetadata } from './types';

function wait(): IOperationMetadata<IWaitOperationData> {
  return {
    description:
      'Waits the given amount of milliseconds before the action continues',
    properties: {
      milliseconds: {
        type: 'ParameterType:integer',
        required: true,
      },
    },
  };
}
export default wait;
