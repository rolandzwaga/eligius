// PINNED COPY of src/operation/helper/parse-expression.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {parseOperand, resolveOperand, type TOperand} from './parse-operand.ts';

/**
 * The comparison operators a condition expression supports.
 */
export type TComparisonOperator = '==' | '!=' | '>=' | '<=' | '>' | '<';

/**
 * A node of a parsed condition expression, see {@link parseExpression}.
 */
export type TExpressionNode =
  | {kind: 'operand'; operand: TOperand}
  | {kind: 'not'; operand: TExpressionNode}
  | {kind: 'and' | 'or'; left: TExpressionNode; right: TExpressionNode}
  | {
      kind: 'comparison';
      operator: TComparisonOperator;
      left: TExpressionNode;
      right: TExpressionNode;
    };

type TSymbol = TComparisonOperator | '&&' | '||' | '!' | '(' | ')';

type TToken =
  | {type: 'symbol'; text: TSymbol; position: number}
  | {type: 'operand'; text: string; position: number; operand: TOperand};

// Longest first, so '!=' is not read as '!' followed by '=', and '>=' not as '>' and '='.
const symbols: readonly TSymbol[] = [
  '&&',
  '||',
  '==',
  '!=',
  '>=',
  '<=',
  '>',
  '<',
  '!',
  '(',
  ')',
];

const comparisonOperators: ReadonlySet<string> = new Set<TComparisonOperator>([
  '==',
  '!=',
  '>=',
  '<=',
  '>',
  '<',
]);

// Characters that end an unquoted operand.
const delimiterPattern = /[\s()!=<>&|]/;

function isDelimiter(char: string | undefined): boolean {
  return char === undefined || delimiterPattern.test(char);
}

/**
 * Parses a condition expression into a tree that {@link evaluateExpression} evaluates.
 *
 * The grammar, from lowest to highest precedence:
 *
 * ```
 * or         := and ('||' and)*
 * and        := comparison ('&&' comparison)*
 * comparison := unary (('==' | '!=' | '>=' | '<=' | '>' | '<') unary)?
 * unary      := '!' unary | primary
 * primary    := '(' or ')' | operand
 * ```
 *
 * Operands are parsed by {@link parseOperand}: numbers, single-quoted strings, `true`,
 * `false`, `null` and `$operationdata.`, `$globaldata.` or `$scope.` property chains.
 * Inside a quoted string, operators and parentheses are part of the text. A quote ends the
 * string only when it is followed by whitespace, an operator, a parenthesis or the end of the
 * expression, so an apostrophe inside the text (`'it's'`) needs no escaping.
 *
 * Comparisons do not chain (`1<x<3` is an error, write `1<x && x<3`). Arithmetic is not
 * supported. Nothing in the expression is executed as code.
 *
 * @param expression The expression text.
 * @param operationName The operation parsing the expression, named in the error messages.
 * @returns The root node of the parsed expression.
 * @throws When the expression is not a string or is empty, contains an unknown operand, an
 * unterminated string, an unknown or misplaced operator, or unbalanced parentheses. The message
 * names the operation, the problem, its position (0-based) and the expression.
 *
 * @example
 * parseExpression("$scope.variables.score>=5 && !$operationdata.skipped", 'when');
 */
export function parseExpression(
  expression: string,
  operationName: string
): TExpressionNode {
  if (typeof expression !== 'string') {
    throw new Error(
      `${operationName}: expression must be a string, received ${expression === null ? 'null' : typeof expression}.`
    );
  }

  const tokens = tokenize(expression, operationName);
  if (!tokens.length) {
    throw new Error(`${operationName}: empty expression '${expression}'.`);
  }

  let index = 0;

  const fail = (message: string, position: number, hint?: string): never => {
    throw new Error(
      `${operationName}: ${message} at position ${position} in expression '${expression}'.${hint ? ` ${hint}` : ''}`
    );
  };

  const unexpected = (token: TToken | undefined, hint?: string): never =>
    token
      ? fail(`unexpected '${token.text}'`, token.position, hint)
      : fail('unexpected end of expression', expression.length, hint);

  const peekSymbol = (): TSymbol | undefined => {
    const token = tokens[index];
    return token?.type === 'symbol' ? token.text : undefined;
  };

  const parseOr = (): TExpressionNode => {
    let left = parseAnd();
    while (peekSymbol() === '||') {
      index++;
      left = {kind: 'or', left, right: parseAnd()};
    }
    return left;
  };

  const parseAnd = (): TExpressionNode => {
    let left = parseComparison();
    while (peekSymbol() === '&&') {
      index++;
      left = {kind: 'and', left, right: parseComparison()};
    }
    return left;
  };

  const parseComparison = (): TExpressionNode => {
    const left = parseUnary();
    const operator = peekSymbol();
    if (operator && comparisonOperators.has(operator)) {
      index++;
      return {
        kind: 'comparison',
        operator: operator as TComparisonOperator,
        left,
        right: parseUnary(),
      };
    }
    return left;
  };

  const parseUnary = (): TExpressionNode => {
    if (peekSymbol() === '!') {
      index++;
      return {kind: 'not', operand: parseUnary()};
    }
    return parsePrimary();
  };

  const parsePrimary = (): TExpressionNode => {
    const token = tokens[index];
    if (token?.type === 'operand') {
      index++;
      return {kind: 'operand', operand: token.operand};
    }
    if (token?.text === '(') {
      index++;
      const node = parseOr();
      const closing = tokens[index];
      if (!closing) {
        return fail("missing ')' for the '('", token.position);
      }
      if (closing.text !== ')') {
        return unexpected(closing, "Expected ')' or an operator.");
      }
      index++;
      return node;
    }
    return unexpected(token);
  };

  const root = parseOr();
  if (index < tokens.length) {
    const token = tokens[index];
    const hint =
      token.text === ')'
        ? "It has no matching '('."
        : token.type === 'symbol' && comparisonOperators.has(token.text)
          ? 'Comparisons do not chain, combine them with && or use parentheses.'
          : 'Expected && or || between the parts of the condition.';
    unexpected(token, hint);
  }
  return root;
}

/**
 * Splits the expression into symbols and operands. Operands are parsed with
 * {@link parseOperand}, so the operand grammar has one source.
 */
function tokenize(expression: string, operationName: string): TToken[] {
  const tokens: TToken[] = [];
  let i = 0;
  while (i < expression.length) {
    const char = expression[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    const symbol = symbols.find(s => expression.startsWith(s, i));
    if (symbol) {
      tokens.push({type: 'symbol', text: symbol, position: i});
      i += symbol.length;
      continue;
    }

    if (char === '=' || char === '&' || char === '|') {
      throw new Error(
        `${operationName}: unexpected '${char}' at position ${i} in expression '${expression}'. Did you mean '${char}${char}'?`
      );
    }

    const end =
      char === "'" ? endOfString(expression, i) : endOfWord(expression, i);
    if (end < 0) {
      throw new Error(
        `${operationName}: unterminated string at position ${i} in expression '${expression}'.`
      );
    }

    const text = expression.substring(i, end);
    tokens.push({
      type: 'operand',
      text,
      position: i,
      operand: parseOperand(text, operationName, expression, i),
    });
    i = end;
  }
  return tokens;
}

/**
 * Returns the index after the quote that closes the string starting at `start`, or -1 when the
 * string is not closed. A quote closes the string only when a delimiter or the end follows it.
 */
function endOfString(expression: string, start: number): number {
  for (let i = start + 1; i < expression.length; i++) {
    if (expression[i] === "'" && isDelimiter(expression[i + 1])) {
      return i + 1;
    }
  }
  return -1;
}

function endOfWord(expression: string, start: number): number {
  let i = start;
  while (i < expression.length && !isDelimiter(expression[i])) {
    i++;
  }
  return i;
}

/**
 * Evaluates a parsed condition expression.
 *
 * `&&` and `||` short-circuit: the right side is not resolved when the left side already
 * decides the result, so a property chain on the right that cannot be resolved is not read.
 * `&&`, `||` and `!` work on truthiness and produce `true` or `false`. A bare operand is
 * tested for truthiness. Comparisons work as before: `==` and `!=` compare strictly,
 * `<`, `<=`, `>` and `>=` use JavaScript ordering.
 *
 * @param node The expression returned by {@link parseExpression}.
 * @param operationData The operation data `$operationdata` chains are resolved against.
 * @param scope The scope `$scope` chains are resolved against.
 * @returns Whether the expression is true.
 * @throws When a property chain that is evaluated cannot be resolved or is not allowed.
 */
export function evaluateExpression(
  node: TExpressionNode,
  operationData: TOperationData,
  scope: IOperationScope
): boolean {
  return Boolean(evaluateNode(node, operationData, scope));
}

function evaluateNode(
  node: TExpressionNode,
  operationData: TOperationData,
  scope: IOperationScope
): unknown {
  switch (node.kind) {
    case 'operand':
      return resolveOperand(node.operand, operationData, scope);
    case 'not':
      return !evaluateNode(node.operand, operationData, scope);
    case 'and':
      return (
        Boolean(evaluateNode(node.left, operationData, scope)) &&
        Boolean(evaluateNode(node.right, operationData, scope))
      );
    case 'or':
      return (
        Boolean(evaluateNode(node.left, operationData, scope)) ||
        Boolean(evaluateNode(node.right, operationData, scope))
      );
    case 'comparison':
      return comparisons[node.operator](
        evaluateNode(node.left, operationData, scope),
        evaluateNode(node.right, operationData, scope)
      );
  }
}

const comparisons: Record<
  TComparisonOperator,
  (left: any, right: any) => boolean
> = {
  '==': (left, right) => left === right,
  '!=': (left, right) => left !== right,
  '>=': (left, right) => left >= right,
  '<=': (left, right) => left <= right,
  '>': (left, right) => left > right,
  '<': (left, right) => left < right,
};
