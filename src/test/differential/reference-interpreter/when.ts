// PINNED COPY of src/operation/when.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';
import {
  evaluateExpression,
  parseExpression,
} from './helper/parse-expression.ts';

/**
 * A condition expression, see {@link when} for the grammar.
 */
type TExpression = string;

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
 * The expression is passed in as a formatted string. An operand can be one of:
 *
 * 'constant': for a constant string (operators and parentheses inside the quotes are text)
 * 100: for a constant number (the whole operand must be numeric, `10px` is invalid)
 * true, false, null: for a boolean or null constant
 * $operationData.foo: for an operation data value
 * $globaldata.foo: for a global data value
 * $scope.loopIndex: for a scope value
 * $scope.variables.foo: for a variable set with `setVariable`
 *
 * Any other operand is an error, so a misspelled chain prefix fails instead of being compared
 * as a string.
 *
 * Operands are combined with these operators, from highest to lowest precedence:
 *
 * `!`: negation
 * `==`, `!=`, `>`, `<`, `>=`, `<=`: comparison (`==` and `!=` compare strictly, without type
 * conversion; comparisons do not chain, so write `0<$scope.loopIndex && $scope.loopIndex<5`)
 * `&&`: and
 * `||`: or
 *
 * Parentheses group. A bare operand is true when its value is truthy, so `'false'` and `'0'`
 * are true and `0`, `''`, `null` and a missing value are false. `!`, `&&` and `||` always
 * produce `true` or `false`. `!` binds tighter than a comparison: `!$operationdata.a==1`
 * compares `!$operationdata.a` with 1, write `!($operationdata.a==1)` to negate the comparison.
 * `&&` and `||` short-circuit: when the left side decides the result, the right side is not
 * resolved, so `$operationdata.user && $operationdata.user.name=='John'` does not fail when
 * `user` is missing.
 *
 * Arithmetic (`+`, `-`, `*`, `/`) is not supported: `-` is a valid character in a property
 * chain, so `$operationdata.a-1` would be ambiguous. Nothing in the expression is executed as
 * code, and property chains are resolved with the usual prototype-pollution and global-object
 * guards.
 *
 * @example
 * $scope.variables.foo=='bar'
 * @example
 * $operationdata.isValid==true
 * @example
 * $globalData.foo>$scope.variables.bar
 * @example
 * $operationData.foo!=100
 * @example
 * $scope.variables.position>=10 && $scope.variables.position<12
 * @example
 * ($scope.variables.answered && $scope.variables.score>=5) || $scope.variables.skipped
 * @example
 * !$operationdata.isHidden
 * @example
 * $operationdata.label=='a && b' || $operationdata.label=='(none)'
 *
 * @param operationData
 * @returns
 * @throws When the expression is not a string or is empty, an operand is not one of the forms
 * above, a string is not closed, an operator is unknown or misplaced, or parentheses do not
 * balance. The message names the problem, its 0-based position and the expression, for example
 * `when: unexpected ')' at position 4 in expression '1==1)'.`
 *
 * @category Control Flow
 */
export const when: TOperation<
  IWhenOperationData,
  Omit<IWhenOperationData, 'expression'>
> = function (operationData: IWhenOperationData) {
  const condition = parseExpression(operationData.expression, 'when');
  const evaluation = evaluateExpression(condition, operationData, this);

  removeProperties(operationData, 'expression');

  this.whenEvaluation = evaluation;

  if (!this.whenEvaluation) {
    this.newIndex = findNextFlowControlIndex(this);
  }

  return operationData;
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
