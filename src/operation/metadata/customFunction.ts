import { ICustomFunctionOperationData } from '../customFunction';
import { IOperationMetadata } from './types';

function customFunction(): IOperationMetadata<ICustomFunctionOperationData> {
  return {
    description: 'Executes the specified custom function',
    properties: {
      systemName: {
        type: 'ParameterType:systemName',
        required: true,
      },
    },
  };
}
export default customFunction;
