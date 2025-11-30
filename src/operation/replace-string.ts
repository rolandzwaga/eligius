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
 * @returns Operation data with `result` containing the replaced string
 *
 * @example
 * ```typescript
 * const result = replaceString({
 *   textContent: 'Hello World',
 *   pattern: 'World',
 *   replacement: 'Universe'
 * });
 * // result.result = "Hello Universe"
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

  operationData.result = textContent.replace(pattern, replacement);

  removeProperties(operationData, 'pattern', 'replacement');

  return operationData;
};
