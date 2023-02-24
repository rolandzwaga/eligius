import { findMatchingOperationIndex } from './helper/find-matching-operation-index';
import { resolveExternalPropertyChain } from './helper/resolve-external-property-chain';
import { IOperationContext, TOperation } from './types';

type TOperator = '!=' | '==' | '>=' | '<=' | '>' | '<';
type TValue =
  | `'${string}'`
  | number
  | `operationdata.${string}`
  | `globaldata.${string}`
  | `context.${string}`;

type TExpression = `${TValue}${TOperator}${TValue}`;

export interface IWhenOperationData {
  expression: TExpression;
}

/**
 * When the given expression evaluates to false, subsequent operations will be skipped
 * until an {@link endWhen} or {@link otherwise} operation is encountered.
 * 
 * Practically, this means an `if` or `if`/`else` statement control flow implementation in a list of operations.
 *
 * @param operationData
 * @returns
 */
export const when: TOperation<IWhenOperationData> = function (
  operationData: IWhenOperationData
) {
  const [left, operator, right] = parseExpression(
    operationData.expression,
    operationData,
    this
  );

  this.whenEvaluation = evaluations[operator](left, right);

  if (!this.whenEvaluation) {
    this.newIndex = findNextFlowControlIndex(this);
  }

  delete (operationData as any).expression;

  return operationData;
};

function parseExpression(
  expression: TExpression,
  operationData: IWhenOperationData,
  operationContext: IOperationContext
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
      ? resolveExternalPropertyChain(operationData, operationContext, left)
      : leftNr) as TValue,
    operator,
    (isNaN(rightNr)
      ? resolveExternalPropertyChain(operationData, operationContext, right)
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

function findNextFlowControlIndex(context: IOperationContext) {
  const currentIndex = context.currentIndex + 1;
  const list = context.operations.slice(currentIndex);

  const otherWiseIndex = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: whenSystemName,
      matchingName: otherwiseSystemName,
    })
  );
  if (otherWiseIndex > -1) {
    return otherWiseIndex + currentIndex;
  }

  const endWhenIndex = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: whenSystemName,
      matchingName: endWhenSystemName,
    })
  );

  return endWhenIndex > -1 ? endWhenIndex + currentIndex : context.operations.length;
}

export const whenSystemName = 'when';
export const otherwiseSystemName = 'otherwise';
export const endWhenSystemName = 'endWhen';
