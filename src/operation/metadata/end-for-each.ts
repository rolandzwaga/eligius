import { IOperationMetadata } from './types';

function endForEach(): IOperationMetadata<never> {
  return {
    description: 'Ends the current loop',
  };
}

export default endForEach;
