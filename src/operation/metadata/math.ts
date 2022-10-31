import { isFunction } from '../../util/guards/is-function';
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
      mathResult: 'ParameterType:number',
    },
  };
}

function createMathFunctionNames() {
  return Object.getOwnPropertyNames(Math)
    .filter((x) => isFunction(Math[x as keyof Math]))
    .map((functionName) => ({
      value: functionName,
    }));
}

export default math;
