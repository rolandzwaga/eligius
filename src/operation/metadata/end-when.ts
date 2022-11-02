import { IOperationMetadata } from './types';

function endWhen(): IOperationMetadata<never> {
  return {
    description: 'Ends the current when block',
  };
}

export default endWhen;
