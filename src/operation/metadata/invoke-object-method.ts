import { IInvokeObjectMethodOperationData } from '../invoke-object-method';
import { IOperationMetadata } from './types';

function invokeObjectMethod(): IOperationMetadata<IInvokeObjectMethodOperationData> {
  return {
    description:
      'Invokes the specified method on the given object with the optional specified arguments',
    properties: {
      instance: {
        type: 'ParameterType:object',
        required: true,
      },
      methodName: {
        type: 'ParameterType:string',
        required: true,
      },
      methodArguments: 'ParameterType:array',
    },
    outputProperties: {
      methodResult: 'ParameterType:object',
    },
  };
}
export default invokeObjectMethod;
