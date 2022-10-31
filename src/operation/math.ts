import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface IMathOperationData {
  args: (number | string | keyof Math)[];
  functionName: keyof Math;
  mathResult?: number;
}

/**
 * This operation performs the given math function with the specified arguments.
 *
 * @param operationData
 */
export const math: TOperation<IMathOperationData> = function (
  operationData: IMathOperationData
) {
  operationData = resolvePropertyValues(
    operationData,
    operationData
  );
  operationData.args = resolveMathConstants(operationData.args);

  const { args, functionName } = operationData;

  operationData.mathResult = (Math[functionName] as Function).apply(null, args);

  return operationData;
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
    typeof value === 'string' &&
    value in Math &&
    typeof Math[value as keyof Math] !== 'function'
  );
}
