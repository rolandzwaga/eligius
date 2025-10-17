import {resolvePropertyValues} from './helper/resolve-property-values.ts';
import type {TOperation} from './types.ts';

export type TCalculationOperator = '+' | '-' | '*' | '/' | '%' | '**';

export interface ICalcOperationData {
  /**
   * The left operand
   * @type=ParameterType:number
   * @required
   * @erased
   */
  left: string | number;
  /**
   * The right operand
   * @type=ParameterType:number
   * @required
   * @erased
   */
  right: string | number;
  /**
   * @required
   * @erased
   */
  operator: TCalculationOperator;
  /**
   * @output
   */
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
 * This operation calculates the given left and right hand operands using the specified operator.
 *
 * @param operationData
 */
export const calc: TOperation<ICalcOperationData> = function (
  operationData: ICalcOperationData
) {
  operationData = resolvePropertyValues(operationData, this, operationData);

  const {left, right, operator} = operationData;

  delete (operationData as any).left;
  delete (operationData as any).right;
  delete (operationData as any).operator;

  operationData.calculationResult = calcFunctions[operator](+left, +right);

  return operationData;
};
