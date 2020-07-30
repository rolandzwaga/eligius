import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function startAction(): IOperationMetadata {
  return {
    description: 'Starts the selected action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default startAction;
