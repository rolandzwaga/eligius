import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export type TCalculationOperator = '+' | '-' | '*' | '/' | '%' | '**';

export interface ICalcOperationData {
  left: string | number;
  right: string | number;
  operator: TCalculationOperator;
  calculationResult?: number;
}

const calcFunctions: Record<
  TCalculationOperator,
  (left: number, right: number) => number
> = {
  '+': (left: number, right: number) => left + right,
  '-': (left: number, right: number) => left - right,
  '*': (left: number, right: number) => left * right,
  '/': (left: number, right: number) => left / right,
  '%': (left: number, right: number) => left % right,
  '**': (left: number, right: number) => left ** right,
};

/**
 * This operation calculates the given left and right hand sides using the specified operator.
 *
 * @param operationData
 */
export const calc: TOperation<ICalcOperationData> = function (
  operationData: ICalcOperationData
) {
  operationData = resolvePropertyValues(operationData, this, operationData);

  const { left, right, operator } = operationData;

  operationData.calculationResult = calcFunctions[operator](+left, +right);

  return operationData;
};
