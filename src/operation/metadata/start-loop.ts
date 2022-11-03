import { TStartLoopOperationData } from '../../operation/start-loop';
import { IOperationMetadata } from './types';

function startLoop(): IOperationMetadata<TStartLoopOperationData> {
  return {
    description: 'Starts a loop over the given collection',
    properties: {
      collection: {
        type: 'ParameterType:array',
        required: true,
      },
    },
  };
}

export default startLoop;
