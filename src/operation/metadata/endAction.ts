import { IEndActionOperationData } from '../endAction';
import { IOperationMetadata } from './types';

function endAction(): IOperationMetadata<IEndActionOperationData> {
  return {
    description: 'Ends the current action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: 'ParameterType:object',
    },
  };
}
export default endAction;
