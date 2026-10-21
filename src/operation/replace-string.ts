import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IReplaceStringOperationData {
  /**
   * @required
   * @dependency
   */
  textContent: string;
  /**
   * @required
   * @erased
   */
  pattern: string | RegExp;
  /**
   * @required
   * @erased
   */
  replacement: string;
  /**
   * @output
   */
  result: string;
}

/**
 * Replaces occurrences of a pattern in a string (alias for replaceText for string context).
 *
 * Like replaceText, a string pattern replaces every occurrence and inserts the replacement
 * literally (`$&`, `$1` and similar are not expanded). A RegExp pattern follows
 * `String.prototype.replace`: only a global RegExp replaces every match, and `$` patterns
 * in the replacement are expanded. Unlike replaceText, the result is written to `result`
 * and `textContent` is left unchanged.
 *
 * @returns Operation data with `result` containing the replaced string
 * @throws When textContent is missing or the string pattern is empty.
 *
 * @example
 * ```typescript
 * const result = replaceString({
 *   textContent: 'a-b-c',
 *   pattern: '-',
 *   replacement: '+'
 * });
 * // result.result = "a+b+c"
 * ```
 *
 * @category String
 */
export const replaceString: TOperation<
  IReplaceStringOperationData,
  Omit<IReplaceStringOperationData, 'pattern' | 'replacement'>
> = (operationData: IReplaceStringOperationData) => {
  const {textContent, pattern, replacement} = operationData;

  if (textContent === undefined || textContent === null) {
    throw new Error('replaceString: textContent is required');
  }

  if (pattern instanceof RegExp) {
    operationData.result = textContent.replace(pattern, replacement);
  } else {
    if (pattern === '') {
      throw new Error('replaceString: pattern must not be empty');
    }
    operationData.result = textContent.split(pattern).join(replacement);
  }

  removeProperties(operationData, 'pattern', 'replacement');

  return operationData;
};
