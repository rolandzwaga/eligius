import { IOperationMetadata } from './types';

function otherwise(): IOperationMetadata<never> {
  return {
    description: 'Inverts the control flow for `when` logic',
  };
}

export default otherwise;
