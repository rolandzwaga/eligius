import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface ISubstringTextOperationData {
  /**
   * @required
   * @dependency
   */
  textContent: string;
  /**
   * @required
   * @erased
   */
  start: number;
  /**
   * @optional
   * @erased
   */
  end?: number;
  /**
   * @output
   */
  substring: string;
}

/**
 * Extracts a substring from text between start and end indices.
 *
 * @returns Operation data with `substring` containing the extracted text
 *
 * @example
 * ```typescript
 * const result = substringText({
 *   textContent: 'Hello World',
 *   start: 0,
 *   end: 5
 * });
 * // result.substring = "Hello"
 * ```
 *
 * @category Text
 */
export const substringText: TOperation<
  ISubstringTextOperationData,
  Omit<ISubstringTextOperationData, 'start' | 'end'>
> = (operationData: ISubstringTextOperationData) => {
  const {textContent, start, end} = operationData;

  if (textContent === undefined || textContent === null) {
    throw new Error('substringText: textContent is required');
  }

  if (typeof start !== 'number') {
    throw new Error('substringText: start must be a number');
  }

  operationData.substring = textContent.substring(start, end);

  removeProperties(operationData, 'start', 'end');

  return operationData;
};
