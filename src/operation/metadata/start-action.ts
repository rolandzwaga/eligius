import { IStartActionOperationData } from '../start-action';
import { IOperationMetadata } from './types';

function startAction(): IOperationMetadata<IStartActionOperationData> {
  return {
    description: 'Starts the selected action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: 'ParameterType:object',
    },
  };
}
export default startAction;
