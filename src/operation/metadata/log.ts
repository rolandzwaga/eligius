import { IOperationMetadata } from './types';

function log(): IOperationMetadata {
  return {
    description: 'Logs the current context and operation data to the console',
  };
}

export default log;
