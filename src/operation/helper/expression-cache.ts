import {
  parseExpression,
  type TExpressionNode,
} from '@operation/helper/parse-expression.ts';

/**
 * Parsed condition expressions, keyed by operation name and expression text.
 *
 * A `when` operation parses its expression on every execution; the text comes
 * from the configuration, so the same handful of expressions is parsed again
 * and again. The parsed tree is never mutated, so it can be shared. Parse
 * errors are not cached: the operation throws them on every execution, as
 * before.
 */
const parsedExpressions = new Map<string, TExpressionNode>();

/**
 * The cache is cleared when it grows past this size, so unbounded dynamic
 * expressions cannot leak memory.
 */
const MAX_CACHED_EXPRESSIONS = 1000;

/**
 * Returns the parsed tree for `expression`, parsing it on the first use.
 *
 * @param expression The expression text, as `parseExpression` takes it
 * @param operationName The operation parsing the expression, named in error messages
 * @returns The parsed expression, shared between calls
 * @throws The `parseExpression` error for an invalid expression
 */
export function getParsedExpression(
  expression: string,
  operationName: string
): TExpressionNode {
  if (typeof expression !== 'string') {
    return parseExpression(expression, operationName);
  }
  const key = `${operationName}\u0000${expression}`;
  const cached = parsedExpressions.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const parsed = parseExpression(expression, operationName);
  if (parsedExpressions.size >= MAX_CACHED_EXPRESSIONS) {
    parsedExpressions.clear();
  }
  parsedExpressions.set(key, parsed);
  return parsed;
}

/**
 * Empties the expression cache. `EngineFactory` calls this when the last
 * engine is destroyed.
 */
export function clearExpressionCache(): void {
  parsedExpressions.clear();
}
