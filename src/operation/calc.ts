import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {resolvePropertyValues} from '@operation/helper/resolve-property-values.ts';
import type {TOperation} from '@operation/types.ts';

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
 * `left`, `right` and `operator` may be property chains (`$operationdata.`, `$globaldata.`,
 * `$scope.`). Only these three inputs are resolved; the rest of the operation data is left as
 * it is.
 *
 * @param operationData
 * @throws When the operator is not one of + - * / % **.
 *
 * @category Utility
 */
export const calc: TOperation<
  ICalcOperationData,
  Omit<ICalcOperationData, 'left' | 'right' | 'operator'>
> = function (operationData: ICalcOperationData) {
  const {left, right, operator} = resolvePropertyValues(operationData, this, {
    left: operationData.left,
    right: operationData.right,
    operator: operationData.operator,
  });

  removeProperties(operationData, 'left', 'right', 'operator');

  if (typeof operator !== 'string' || !Object.hasOwn(calcFunctions, operator)) {
    throw new Error(
      `calc: unknown operator '${String(operator)}', expected one of ${Object.keys(calcFunctions).join(' ')}`
    );
  }

  operationData.calculationResult = calcFunctions[operator](+left, +right);

  return operationData;
};
