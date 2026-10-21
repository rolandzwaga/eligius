import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

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
 *
 * @category Control Flow
 */
export const when: TOperation<
  IWhenOperationData,
  Omit<IWhenOperationData, 'expression'>
> = function (operationData: IWhenOperationData) {
  const [left, operator, right] = parseExpression(
    operationData.expression,
    operationData,
    this
  );

  removeProperties(operationData, 'expression');

  this.whenEvaluation = evaluations[operator](left, right);

  if (!this.whenEvaluation) {
    this.newIndex = findNextFlowControlIndex(this);
  }

  return operationData;
};

function parseExpression(
  expression: TExpression,
  operationData: IWhenOperationData,
  operationScope: IOperationScope
): [TValue, TOperator, TValue] {
  const [left, operator, right] = splitExpression(expression);

  return [
    resolveOperand(left, operationData, operationScope),
    operator,
    resolveOperand(right, operationData, operationScope),
  ];
}

// Two-character operators first, so '>=' is not read as '>' followed by '='.
const operators: TOperator[] = ['!=', '==', '>=', '<=', '>', '<'];

/**
 * Splits the expression on the first operator that is not inside a quoted
 * string literal. Throws when there is no operator or an operand is empty.
 */
function splitExpression(expression: string): [string, TOperator, string] {
  let inQuote = false;
  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === "'") {
      inQuote = !inQuote;
      continue;
    }
    if (inQuote) {
      continue;
    }
    const operator = operators.find(op => expression.startsWith(op, i));
    if (operator) {
      const left = expression.substring(0, i).trim();
      const right = expression.substring(i + operator.length).trim();
      if (left.length && right.length) {
        return [left, operator, right];
      }
      break;
    }
  }
  throw new Error(`when: invalid expression '${expression}'`);
}

/**
 * A quoted token (`'John'`) is a string constant, a numeric token is a number,
 * anything else is resolved as an operation data, global data or scope chain.
 */
function resolveOperand(
  token: string,
  operationData: IWhenOperationData,
  operationScope: IOperationScope
): TValue {
  const quoted = /^'(.*)'$/s.exec(token);
  if (quoted) {
    return quoted[1] as TValue;
  }

  const tokenNr = parseFloat(token);
  return (
    Number.isNaN(tokenNr)
      ? resolveExternalPropertyChain(
          operationData,
          operationScope,
          token as ExternalProperty
        )
      : tokenNr
  ) as TValue;
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

/**
 * Finds the `otherwise` or `endWhen` that belongs to this `when`, skipping nested
 * when/otherwise/endWhen blocks (whether or not they have an `otherwise`).
 */
function findNextFlowControlIndex(scope: IOperationScope) {
  const {operations} = scope;
  let depth = 0;
  for (let i = scope.currentIndex + 1; i < operations.length; i++) {
    const {systemName} = operations[i];
    if (systemName === whenSystemName) {
      depth++;
    } else if (systemName === endWhenSystemName) {
      if (depth === 0) {
        return i;
      }
      depth--;
    } else if (systemName === otherwiseSystemName && depth === 0) {
      return i;
    }
  }
  return operations.length;
}

export const whenSystemName = 'when';
export const otherwiseSystemName = 'otherwise';
export const endWhenSystemName = 'endWhen';
