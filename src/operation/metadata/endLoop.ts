import { IOperationMetadata } from './types';

function endLoop(): IOperationMetadata {
  return {
    description: 'Ends the current loop',
  };
}

export default endLoop;
