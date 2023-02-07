import { IForEachOperationData } from '../for-each';
import { IOperationMetadata } from './types';

function forEach(): IOperationMetadata<IForEachOperationData> {
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

export default forEach;
