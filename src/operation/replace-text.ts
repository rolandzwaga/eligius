import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IReplaceTextOperationData {
  /**
   * @required
   * @dependency
   */
  textContent: string;
  /**
   * @required
   * @erased
   */
  searchPattern: string | RegExp;
  /**
   * @required
   * @erased
   */
  replacement: string;
  /**
   * @output
   */
  replacementCount: number;
}

/**
 * Finds and replaces text using literal string or regex pattern.
 *
 * Operates on textContent passed from previous operations (e.g., getTextContent).
 * Supports regex patterns with global flag for multiple replacements.
 * Updates textContent with replaced text and sets replacementCount.
 *
 * @returns Operation data with updated `textContent` and `replacementCount` indicating number of replacements made
 *
 * @example
 * ```typescript
 * // Replace placeholder with value
 * const result = replaceText({
 *   textContent: 'Hello {{name}}',
 *   searchPattern: '{{name}}',
 *   replacement: 'John'
 * });
 * // result.textContent = "Hello John"
 * // result.replacementCount = 1
 * ```
 *
 * @example
 * ```typescript
 * // Replace with regex pattern
 * const result = replaceText({
 *   textContent: 'Test 123 and 456',
 *   searchPattern: /\d+/g,
 *   replacement: 'NUM'
 * });
 * // result.textContent = "Test NUM and NUM"
 * // result.replacementCount = 2
 * ```
 *
 * @category Text
 */
export const replaceText: TOperation<
  IReplaceTextOperationData,
  Omit<IReplaceTextOperationData, 'searchPattern' | 'replacement'>
> = (operationData: IReplaceTextOperationData) => {
  const {textContent, searchPattern, replacement} = operationData;

  if (textContent === undefined || textContent === null) {
    throw new Error('replaceText: textContent is required');
  }

  let newText: string;
  let count = 0;

  if (searchPattern instanceof RegExp) {
    // Count matches for regex
    const matches = textContent.match(searchPattern);
    count = matches ? matches.length : 0;
    newText = textContent.replace(searchPattern, replacement);
  } else {
    // Count matches for string
    const parts = textContent.split(searchPattern);
    count = parts.length - 1;
    newText = parts.join(replacement);
  }

  operationData.textContent = newText;
  operationData.replacementCount = count;

  removeProperties(operationData, 'searchPattern', 'replacement');

  return operationData;
};
