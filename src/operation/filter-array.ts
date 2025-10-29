import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface IFilterArrayOperationData {
  /**
   * @required
   * @dependency
   */
  arrayData: any[];
  /**
   * @optional
   * @erased
   */
  filterProperty?: string;
  /**
   * @optional
   * @erased
   */
  filterValue?: any;
  /**
   * @optional
   * @erased
   */
  filterPredicate?: (item: any, index?: number) => boolean;
  /**
   * @output
   */
  filteredArray: any[];
}

/**
 * Filters an array based on property equality or custom predicate function.
 *
 * Operates on arrayData passed from previous operations.
 * Supports two filtering modes:
 * 1. Property equality: `filterProperty` and `filterValue` to filter by property match
 * 2. Custom predicate: `filterPredicate` function for complex filtering logic
 *
 * @returns Operation data with `filteredArray` containing filtered results
 *
 * @example
 * ```typescript
 * // Filter by property equality
 * const result = filterArray({
 *   arrayData: [{name: 'Alice', age: 25}, {name: 'Bob', age: 30}],
 *   filterProperty: 'age',
 *   filterValue: 25
 * });
 * // result.filteredArray = [{name: 'Alice', age: 25}]
 * ```
 *
 * @example
 * ```typescript
 * // Filter with custom predicate
 * const result = filterArray({
 *   arrayData: [1, 2, 3, 4, 5],
 *   filterPredicate: (item) => item % 2 === 0
 * });
 * // result.filteredArray = [2, 4]
 * ```
 *
 * @category Array
 */
export const filterArray: TOperation<
  IFilterArrayOperationData,
  Omit<
    IFilterArrayOperationData,
    'filterProperty' | 'filterValue' | 'filterPredicate'
  >
> = (operationData: IFilterArrayOperationData) => {
  const {arrayData, filterProperty, filterValue, filterPredicate} =
    operationData;

  if (!Array.isArray(arrayData)) {
    throw new Error('filterArray: arrayData is required and must be an array');
  }

  if (!filterPredicate && (!filterProperty || filterValue === undefined)) {
    throw new Error(
      'filterArray: filterProperty/filterValue or filterPredicate is required'
    );
  }

  let filtered: any[];

  if (filterPredicate) {
    filtered = arrayData.filter(filterPredicate);
  } else {
    filtered = arrayData.filter(item => {
      if (typeof item === 'object' && item !== null) {
        return item[filterProperty!] === filterValue;
      }
      return false;
    });
  }

  operationData.filteredArray = filtered;

  removeProperties(
    operationData,
    'filterProperty',
    'filterValue',
    'filterPredicate'
  );

  return operationData;
};
