import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface IConcatenateStringsOperationData {
  /**
   * @required
   * @erased
   */
  strings: string[];
  /**
   * @optional
   * @erased
   */
  separator?: string;
  /**
   * @output
   */
  result: string;
}

/**
 * Concatenates multiple strings with an optional separator.
 *
 * @returns Operation data with `result` containing the concatenated string
 *
 * @example
 * ```typescript
 * const result = concatenateStrings({
 *   strings: ['Hello', 'World'],
 *   separator: ' '
 * });
 * // result.result = "Hello World"
 * ```
 *
 * @category String
 */
export const concatenateStrings: TOperation<
  IConcatenateStringsOperationData,
  Omit<IConcatenateStringsOperationData, 'strings' | 'separator'>
> = (operationData: IConcatenateStringsOperationData) => {
  const {strings, separator = ''} = operationData;

  if (!Array.isArray(strings)) {
    throw new Error('concatenateStrings: strings must be an array');
  }

  operationData.result = strings.join(separator);

  removeProperties(operationData, 'strings', 'separator');

  return operationData;
};
