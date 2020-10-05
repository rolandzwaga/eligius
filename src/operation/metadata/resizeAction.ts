import { IResizeActionOperationData } from '../resizeAction';
import { IOperationMetadata } from './types';

function resizeAction(): IOperationMetadata<IResizeActionOperationData> {
  return {
    description: 'Triggers a resize on the current action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: 'ParameterType:object',
    },
  };
}
export default resizeAction;
