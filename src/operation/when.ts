import {findMatchingOperationIndex} from './helper/find-matching-operation-index.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from './helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperation} from './types.ts';

type TOperator = '!=' | '==' | '>=' | '<=' | '>' | '<';
type TValue =
  | `'${string}'`
  | number
  | `$operationdata.${string}`
  | `$globaldata.${string}`
  | `$scope.${string}`;

type TExpression = `${TValue}${TOperator}${TValue}`;

export interface IWhenOperationData {
  /**
   * @type=ParameterType:expression
   * @required
   * @erased
   */
  expression: TExpression;
}

/**
 * When the given expression evaluates to false, subsequent operations will be skipped
 * until an {@link endWhen} or {@link otherwise} operation is encountered.
 *
 * Practically, this means an `if` or `if`/`else` statement control flow implementation in a list of operations.
 * 
 * The expression is passed in as a formatted string.
 * The left and right values of the expression can be defined like this:
 * 
 * 'constant': for a constant string
 * 100: for a constant number
 * $operationData.foo: for an operation data value
 * $globaldata.foo: for a global data value
 * $scope.loopIndex: for a scope value
 * @foo: for a variable value
 * 
 * @example
 * $scope.variables.foo=='bar'
 * @example
 * $globalData.foo>$scope.variables.bar
 * @example
 * $operationData.foo!=100
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

  delete (operationData as any).expression;

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
  operationScope: IOperationScope
): [TValue, TOperator, TValue] {
  const [left, right] = expression.split(/!=|==|>=|<=|>|</);

  const operator = expression.substring(
    left.length,
    expression.length - right.length
  ) as TOperator;

  const leftNr = parseFloat(left);
  const rightNr = parseFloat(right);

  return [
    (Number.isNaN(leftNr)
      ? resolveExternalPropertyChain(
          operationData,
          operationScope,
          left as ExternalProperty
        )
      : leftNr) as TValue,
    operator,
    (Number.isNaN(rightNr)
      ? resolveExternalPropertyChain(
          operationData,
          operationScope,
          right as ExternalProperty
        )
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

function findNextFlowControlIndex(scope: IOperationScope) {
  const currentIndex = scope.currentIndex + 1;
  const list = scope.operations.slice(currentIndex);

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

  return endWhenIndex > -1
    ? endWhenIndex + currentIndex
    : scope.operations.length;
}

export const whenSystemName = 'when';
export const otherwiseSystemName = 'otherwise';
export const endWhenSystemName = 'endWhen';
