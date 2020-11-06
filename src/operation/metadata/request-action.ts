import { IRequestActionOperationData } from '../request-action';
import { IOperationMetadata } from './types';

function requestAction(): IOperationMetadata<IRequestActionOperationData> {
  return {
    description: 'Retrieves an instance of the specified action',
    properties: {
      systemName: {
        type: 'ParameterType:actionName',
      },
    },
    outputProperties: {
      actionInstance: 'ParameterType:object',
    },
  };
}
export default requestAction;
