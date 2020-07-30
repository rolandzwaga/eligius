import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function resizeAction(): IOperationMetadata {
  return {
    description: 'Triggers a resize on the current action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default resizeAction;
