import {findMatchingOperationIndex} from './helper/find-matching-operation-index.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from './helper/resolve-external-property-chain.ts';
import type {IOperationContext, TOperation} from './types.ts';

type TOperator = '!=' | '==' | '>=' | '<=' | '>' | '<';
type TValue =
  | `'${string}'`
  | number
  | `operationdata.${string}`
  | `globaldata.${string}`
  | `context.${string}`
  | `@${string}`;

type TExpression = `${TValue}${TOperator}${TValue}`;

export interface IWhenOperationData {
  /**
   * @type=ParameterType:expression
   * @required
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
 * operationData.foo: for an operation data value
 * globaldata.foo: for a global data value
 * context.loopIndex: for a context value
 * @foo: for a variable value
 * 
 * @example
 * @foo=='bar'
 * @example
 * globalData.foo>@bar
 * @example
 * operationData.foo!=100
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
  const [left, right] = expression.split(/!=|==|>=|<=|>|</);

  const operator = expression.substring(
    left.length,
    expression.length - right.length
  ) as TOperator;

  const leftNr = parseFloat(left);
  const rightNr = parseFloat(right);

  return [
    (Number.isNaN(leftNr)
      ? left.startsWith('@') ? getContextVar(operationContext.variables, left) : resolveExternalPropertyChain(
          operationData,
          operationContext,
          left as ExternalProperty
        )
      : leftNr) as TValue,
    operator,
    (Number.isNaN(rightNr)
      ? right.startsWith('@') ? getContextVar(operationContext.variables, right) : resolveExternalPropertyChain(
          operationData,
          operationContext,
          right as ExternalProperty
        )
      : rightNr) as TValue,
  ];
}

const getContextVar = (variables: Record<string, any>, identifier: string) => {
  const name = identifier.substring(1);
  return variables ? variables[name] : undefined;
};

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

  return endWhenIndex > -1
    ? endWhenIndex + currentIndex
    : context.operations.length;
}

export const whenSystemName = 'when';
export const otherwiseSystemName = 'otherwise';
export const endWhenSystemName = 'endWhen';
