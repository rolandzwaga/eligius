import { isFunction } from '../util/guards/is-function.ts';
import { isString } from '../util/guards/is-string.ts';
import { resolvePropertyValues } from './helper/resolve-property-values.ts';
import type { TOperation } from './types.ts';

export type MathFunctionKeys = {
  [K in keyof Math]: Math[K] extends (...args: any) => any ? K : never;
}[keyof Math];

export type MathNonFunctionKeys = {
  [K in keyof Math]: Math[K] extends (...args: any) => any ? never : K;
}[keyof Math];


export interface IMathOperationData {
  /**
   * @type=ParameterType:array
   * @required
   */
  args: (number | string | MathNonFunctionKeys)[];
  /**
   * @required
   */
  functionName: MathFunctionKeys;
  /**
   * @output
   */
  mathResult?: number;
}

/**
 * This operation performs the given math function with the specified arguments.
 */
export const math: TOperation<IMathOperationData, Omit<IMathOperationData, 'args'|'functionName'>> = function (
  operationData: IMathOperationData
) {
  operationData = resolvePropertyValues(operationData, this, operationData);
  operationData.args = resolveMathConstants(operationData.args);

  const { args, functionName, ...newOperationData } = operationData;

  newOperationData.mathResult = (Math[functionName] as Function).apply(null, args);

  return newOperationData;
};

function resolveMathConstants(args: any[]) {
  return args.map((arg: any) => {
    if (isMathProperty(arg)) {
      return Math[arg];
    }
    return arg;
  });
}

function isMathProperty(value: string | Symbol): value is keyof Math {
  return (
    isString(value) && value in Math && !isFunction(Math[value as keyof Math])
  );
}
