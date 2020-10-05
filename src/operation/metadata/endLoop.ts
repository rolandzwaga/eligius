import { IOperationMetadata } from './types';

function endLoop(): IOperationMetadata<never> {
  return {
    description: 'Ends the current loop',
  };
}

export default endLoop;
