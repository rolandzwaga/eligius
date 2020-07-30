import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function endAction(): IOperationMetadata {
  return {
    description: 'Ends the current action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default endAction;
