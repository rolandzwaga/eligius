import { IWhenOperationData } from '../../operation/when';
import { IOperationMetadata } from './types';

function wait(): IOperationMetadata<IWhenOperationData> {
  return {
    description:
      'Evaluates the given expression, when it evaluates to false context.skipNextOperation will be set to true',
    properties: {
      expression: {
        type: 'ParameterType:expression',
        required: true,
      },
    },
  };
}
export default wait;
