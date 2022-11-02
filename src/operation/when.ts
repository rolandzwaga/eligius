import { resolveOperationOrGlobalDataPropertyChain } from './helper/resolve-operation-or-global-data-property-chain';
import { TOperation } from './types';

type TOperator = '!=' | '==' | '>=' | '<=' | '>' | '<';
type TValue =
  | `'${string}'`
  | number
  | `operationdata.${string}`
  | `globaldata.${string}`;

type TExpression = `${TValue}${TOperator}${TValue}`;

export interface IWhenOperationData {
  expression: TExpression;
}

/**
 * When the given expression evaluates to false, subsequent operations will be skipped
 * until an `endWhen` operation is encountered.
 * Practically, this mean an `if` statement control flow implementation in a list of operations.
 *
 * @param operationData
 * @returns
 */
export const when: TOperation<IWhenOperationData> = function (
  operationData: IWhenOperationData
) {
  const [left, operator, right] = parseExpression(
    operationData.expression,
    operationData
  );

  const evaluationResult = evaluations[operator](left, right);

  this.skipNextOperation = !evaluationResult;

  delete (operationData as any).expression;

  return operationData;
};

function parseExpression(
  expression: TExpression,
  operationData: IWhenOperationData
): [TValue, TOperator, TValue] {
  let [left, right] = expression.split(/!=|==|>=|<=|>|</);
  const operator = expression.substring(
    left.length,
    expression.length - right.length
  ) as TOperator;
  const leftNr = +left;
  const rightNr = +right;
  return [
    (isNaN(leftNr)
      ? resolveOperationOrGlobalDataPropertyChain(operationData, left)
      : leftNr) as TValue,
    operator,
    (isNaN(rightNr)
      ? resolveOperationOrGlobalDataPropertyChain(operationData, right)
      : rightNr) as TValue,
  ];
}

const evaluations: Record<
  TOperator,
  (left: string | number, right: string | number) => boolean
> = {
  '==': (left: string | number, right: string | number) => left === right,
  '!=': (left: string | number, right: string | number) => left !== right,
  '>=': (left: string | number, right: string | number) => left >= right,
  '<=': (left: string | number, right: string | number) => left <= right,
  '>': (left: string | number, right: string | number) => left > right,
  '<': (left: string | number, right: string | number) => left < right,
};
