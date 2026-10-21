import {parseOperand, resolveOperand} from '@operation/helper/parse-operand.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

type TOperator = '!=' | '==' | '>=' | '<=' | '>' | '<';
type TValue =
  | `'${string}'`
  | number
  | boolean
  | null
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
 * 100: for a constant number (the whole operand must be numeric, `10px` is invalid)
 * true, false, null: for a boolean or null constant
 * $operationData.foo: for an operation data value
 * $globaldata.foo: for a global data value
 * $scope.loopIndex: for a scope value
 * $scope.variables.foo: for a variable set with `setVariable`
 *
 * Any other operand is an error, so a misspelled chain prefix fails instead of being compared
 * as a string. `==` and `!=` compare strictly (without type conversion).
 *
 * @example
 * $scope.variables.foo=='bar'
 * @example
 * $operationdata.isValid==true
 * @example
 * $globalData.foo>$scope.variables.bar
 * @example
 * $operationData.foo!=100
 *
 * @param operationData
 * @returns
 * @throws When the expression has no operator, an operand is empty, or an operand is not one of
 * the forms above. The message names the operand and the expression.
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
  const leftOperand = parseOperand(left, 'when', expression);
  const rightOperand = parseOperand(right, 'when', expression);

  return [
    resolveOperand(leftOperand, operationData, operationScope) as TValue,
    operator,
    resolveOperand(rightOperand, operationData, operationScope) as TValue,
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

type TComparable = TValue | undefined;

const evaluations: Record<
  TOperator,
  (left: TComparable, right: TComparable) => boolean
> = {
  '==': (left, right) => left === right,
  '!=': (left, right) => left !== right,
  '>=': (left, right) => (left as any) >= (right as any),
  '<=': (left, right) => (left as any) <= (right as any),
  '>': (left, right) => (left as any) > (right as any),
  '<': (left, right) => (left as any) < (right as any),
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
