import {resolvePropertyValues} from '@operation/helper/resolve-property-values.ts';
import type {TOperation} from '@operation/types.ts';
import {isFunction} from '@util/guards/is-function.ts';
import {isString} from '@util/guards/is-string.ts';

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
   * @erased
   */
  args: (number | string | MathNonFunctionKeys)[];
  /**
   * @type=ParameterType:mathfunction
   * @required
   * @erased
   */
  functionName: MathFunctionKeys;
  /**
   * @output
   */
  mathResult?: number;
}

/**
 * This operation performs the given math function with the specified arguments.
 *
 * `args` and `functionName` may contain property chains (`$operationdata.`, `$globaldata.`,
 * `$scope.`). Only these two inputs are resolved; the rest of the operation data is left as it
 * is. Arguments that name a Math constant (such as `'PI'`) are replaced by its value.
 *
 * @throws When `functionName` is not a function of `Math`, or `args` is not an array.
 *
 * @category Utility
 */
export const math: TOperation<
  IMathOperationData,
  Omit<IMathOperationData, 'args' | 'functionName'>
> = function (operationData: IMathOperationData) {
  const resolved = resolvePropertyValues(operationData, this, {
    args: operationData.args,
    functionName: operationData.functionName,
  });

  const {
    args: _args,
    functionName: _functionName,
    ...newOperationData
  } = operationData;
  const {functionName} = resolved;

  if (
    typeof functionName !== 'string' ||
    !Object.hasOwn(Math, functionName) ||
    !isFunction(Math[functionName as keyof Math])
  ) {
    throw new Error(`math: unknown function '${String(functionName)}'`);
  }
  if (!Array.isArray(resolved.args)) {
    throw new Error('math: args must be an array');
  }
  const args = resolveMathConstants(resolved.args);

  newOperationData.mathResult = (
    Math[functionName] as (...args: any[]) => any
  ).apply(null, args);

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

function isMathProperty(value: string | symbol): value is keyof Math {
  return (
    isString(value) &&
    Object.hasOwn(Math, value) &&
    !isFunction(Math[value as keyof Math])
  );
}
