import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface ISplitStringOperationData {
  /**
   * @required
   * @dependency
   */
  textContent: string;
  /**
   * @required
   * @erased
   */
  delimiter: string | RegExp;
  /**
   * @optional
   * @erased
   */
  limit?: number;
  /**
   * @output
   */
  resultArray: string[];
}

/**
 * Splits a string into an array by delimiter (string or regex).
 *
 * @returns Operation data with `resultArray` containing the split strings
 *
 * @example
 * ```typescript
 * const result = splitString({
 *   textContent: 'apple,banana,cherry',
 *   delimiter: ','
 * });
 * // result.resultArray = ['apple', 'banana', 'cherry']
 * ```
 *
 * @category String
 */
export const splitString: TOperation<
  ISplitStringOperationData,
  Omit<ISplitStringOperationData, 'delimiter' | 'limit'>
> = (operationData: ISplitStringOperationData) => {
  const {textContent, delimiter, limit} = operationData;

  if (textContent === undefined || textContent === null) {
    throw new Error('splitString: textContent is required');
  }

  operationData.resultArray = textContent.split(delimiter, limit);

  removeProperties(operationData, 'delimiter', 'limit');

  return operationData;
};
