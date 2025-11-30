import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export type SortOrder = 'asc' | 'desc';

export interface ISortArrayOperationData {
  /**
   * @required
   * @dependency
   */
  arrayData: any[];
  /**
   * @optional
   * @erased
   */
  sortProperty?: string;
  /**
   * @optional
   * @erased
   */
  sortOrder?: SortOrder;
  /**
   * @optional
   * @erased
   */
  sortComparator?: (a: any, b: any) => number;
  /**
   * @output
   */
  sortedArray: any[];
}

/**
 * Sorts an array by property, natural order, or custom comparator function.
 *
 * Operates on arrayData passed from previous operations.
 * Supports three sorting modes:
 * 1. Property sort: `sortProperty` and `sortOrder` to sort objects by property
 * 2. Natural sort: `sortOrder` alone for primitive arrays
 * 3. Custom comparator: `sortComparator` function for complex sorting logic
 *
 * @returns Operation data with `sortedArray` containing sorted results
 *
 * @example
 * ```typescript
 * // Sort objects by property
 * const result = sortArray({
 *   arrayData: [{name: 'Bob', age: 30}, {name: 'Alice', age: 25}],
 *   sortProperty: 'age',
 *   sortOrder: 'asc'
 * });
 * // result.sortedArray = [{name: 'Alice', age: 25}, {name: 'Bob', age: 30}]
 * ```
 *
 * @example
 * ```typescript
 * // Sort primitives
 * const result = sortArray({
 *   arrayData: [5, 2, 8, 1],
 *   sortOrder: 'desc'
 * });
 * // result.sortedArray = [8, 5, 2, 1]
 * ```
 *
 * @example
 * ```typescript
 * // Custom comparator
 * const result = sortArray({
 *   arrayData: ['apple', 'Banana', 'cherry'],
 *   sortComparator: (a, b) => a.toLowerCase().localeCompare(b.toLowerCase())
 * });
 * ```
 *
 * @category Array
 */
export const sortArray: TOperation<
  ISortArrayOperationData,
  Omit<ISortArrayOperationData, 'sortProperty' | 'sortOrder' | 'sortComparator'>
> = (operationData: ISortArrayOperationData) => {
  const {arrayData, sortProperty, sortOrder, sortComparator} = operationData;

  if (!Array.isArray(arrayData)) {
    throw new Error('sortArray: arrayData is required and must be an array');
  }

  // Create a copy to avoid mutating original
  const sorted = [...arrayData];

  if (sortComparator) {
    sorted.sort(sortComparator);
  } else if (sortProperty) {
    sorted.sort((a, b) => {
      const aVal = a[sortProperty];
      const bVal = b[sortProperty];

      if (aVal < bVal) return sortOrder === 'desc' ? 1 : -1;
      if (aVal > bVal) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  } else {
    // Natural sort for primitives
    sorted.sort((a, b) => {
      if (a < b) return sortOrder === 'desc' ? 1 : -1;
      if (a > b) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  operationData.sortedArray = sorted;

  removeProperties(
    operationData,
    'sortProperty',
    'sortOrder',
    'sortComparator'
  );

  return operationData;
};
