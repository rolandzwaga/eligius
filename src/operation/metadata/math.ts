import { IMathOperationData } from '../math';
import { IOperationMetadata } from './types';

function math(): IOperationMetadata<IMathOperationData> {
  return {
    description:
      'This operation performs the given math function of the specified arguments.',
    properties: {
      args: {
        type: 'ParameterType:array',
        required: true,
      },
      functionName: createMathFunctionNames(),
      propertyName: {
        type: 'ParameterType:string',
        defaultValue: 'mathResult',
      },
    },
  };
}

function createMathFunctionNames() {
  return Object.getOwnPropertyNames(Math)
    .filter((x) => typeof Math[x as keyof Math] === 'function')
    .map((functionName) => ({
      value: functionName,
    }));
}

export default math;