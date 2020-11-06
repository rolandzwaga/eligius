import { IStartLoopOperationData } from '../start-loop';
import { IOperationMetadata } from './types';

function startLoop(): IOperationMetadata<IStartLoopOperationData> {
  return {
    description: 'Starts a loop over the given collection',
    properties: {
      collection: {
        type: 'ParameterType:array',
        required: true,
      },
      propertyName: {
        type: 'ParameterType:string',
        defaultValue: 'currentItem',
      },
    },
  };
}

export default startLoop;
