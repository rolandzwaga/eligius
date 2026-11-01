// PINNED COPY of src/operation/helper/parse-operand.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {
  type ExternalProperty,
  isExternalProperty,
  resolveExternalPropertyChain,
} from './resolve-external-property-chain.ts';

/**
 * A parsed expression operand: either a literal value or a property chain that is
 * resolved when the expression is evaluated.
 */
export type TOperand =
  | {kind: 'literal'; value: string | number | boolean | null}
  | {kind: 'chain'; chain: ExternalProperty};

const numberPattern = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
const quotedPattern = /^'(.*)'$/s;
// After the prefix: one or more segments separated by single dots, without
// whitespace or quotes. Segments may use bracket indices and a '+suffix'.
const chainPattern =
  /^\$(operationdata|globaldata|scope)\.[^\s.'"]+(\.[^\s.'"]+)*$/i;

const keywords: Record<string, boolean | null> = {
  true: true,
  false: false,
  null: null,
};

/**
 * Parses one operand of a condition expression. The tokenizer in `parse-expression.ts`
 * calls it for every operand it finds, so this function is the single definition of the
 * operand grammar.
 *
 * The operand grammar:
 * - a number: `100`, `-1.5`, `2e3` (the whole token must be numeric, so `10px` is invalid);
 * - a string in single quotes: `'John'`;
 * - the keywords `true`, `false` and `null`;
 * - a property chain starting with `$operationdata.`, `$globaldata.` or `$scope.` (the prefix
 *   is case-insensitive), for example `$scope.variables.count`.
 *
 * @param token The operand text, already trimmed.
 * @param operationName The operation parsing the expression, named in the error.
 * @param expression The whole expression, quoted in the error.
 * @param position The 0-based position of the operand in the expression, named in the error
 * when given.
 * @returns The parsed operand.
 * @throws When the token matches none of the forms above.
 */
export function parseOperand(
  token: string,
  operationName: string,
  expression: string,
  position?: number
): TOperand {
  const quoted = quotedPattern.exec(token);
  if (quoted) {
    return {kind: 'literal', value: quoted[1]};
  }
  if (Object.hasOwn(keywords, token)) {
    return {kind: 'literal', value: keywords[token]};
  }
  if (numberPattern.test(token)) {
    return {kind: 'literal', value: Number(token)};
  }
  if (
    isExternalProperty(token as ExternalProperty) &&
    chainPattern.test(token)
  ) {
    return {kind: 'chain', chain: token as ExternalProperty};
  }
  throw new Error(
    `${operationName}: unknown operand '${token}' in expression '${expression}'${position === undefined ? '' : ` at position ${position}`}. Use a number, a quoted string ('text'), true, false, null, or a property chain starting with $operationdata., $globaldata. or $scope.`
  );
}

/**
 * Returns the value of a parsed operand, resolving a property chain against the given
 * operation data and scope.
 *
 * @param operand The operand returned by {@link parseOperand}.
 * @param operationData The operation data `$operationdata` chains are resolved against.
 * @param scope The scope `$scope` chains are resolved against.
 * @returns The operand's value.
 */
export function resolveOperand(
  operand: TOperand,
  operationData: TOperationData,
  scope: IOperationScope
): unknown {
  return operand.kind === 'literal'
    ? operand.value
    : resolveExternalPropertyChain(operationData, scope, operand.chain);
}
