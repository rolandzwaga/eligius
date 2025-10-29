import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface IFindInArrayOperationData {
  /**
   * @required
   * @dependency
   */
  arrayData: any[];
  /**
   * @optional
   * @erased
   */
  findProperty?: string;
  /**
   * @optional
   * @erased
   */
  findValue?: any;
  /**
   * @optional
   * @erased
   */
  findPredicate?: (item: any, index?: number) => boolean;
  /**
   * @output
   */
  foundItem: any | undefined;
  /**
   * @output
   */
  foundIndex: number;
}

/**
 * Finds the first element in an array matching criteria.
 *
 * Operates on arrayData passed from previous operations.
 * Supports two search modes:
 * 1. Property equality: `findProperty` and `findValue` to find by property match
 * 2. Custom predicate: `findPredicate` function for complex search logic
 *
 * Returns `undefined` for `foundItem` and `-1` for `foundIndex` if no match found.
 *
 * @returns Operation data with `foundItem` (the matching element) and `foundIndex` (its position)
 *
 * @example
 * ```typescript
 * // Find by property equality
 * const result = findInArray({
 *   arrayData: [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}],
 *   findProperty: 'id',
 *   findValue: 2
 * });
 * // result.foundItem = {id: 2, name: 'Bob'}
 * // result.foundIndex = 1
 * ```
 *
 * @example
 * ```typescript
 * // Find with custom predicate
 * const result = findInArray({
 *   arrayData: [10, 25, 30, 45],
 *   findPredicate: (item) => item > 30
 * });
 * // result.foundItem = 45
 * // result.foundIndex = 3
 * ```
 *
 * @category Array
 */
export const findInArray: TOperation<
  IFindInArrayOperationData,
  Omit<
    IFindInArrayOperationData,
    'findProperty' | 'findValue' | 'findPredicate'
  >
> = (operationData: IFindInArrayOperationData) => {
  const {arrayData, findProperty, findValue, findPredicate} = operationData;

  if (!Array.isArray(arrayData)) {
    throw new Error('findInArray: arrayData is required and must be an array');
  }

  if (!findPredicate && (!findProperty || findValue === undefined)) {
    throw new Error(
      'findInArray: findProperty/findValue or findPredicate is required'
    );
  }

  let foundItem: any | undefined;
  let foundIndex = -1;

  if (findPredicate) {
    foundIndex = arrayData.findIndex(findPredicate);
    foundItem = foundIndex !== -1 ? arrayData[foundIndex] : undefined;
  } else {
    foundIndex = arrayData.findIndex(item => {
      if (typeof item === 'object' && item !== null) {
        return item[findProperty!] === findValue;
      }
      return item === findValue;
    });
    foundItem = foundIndex !== -1 ? arrayData[foundIndex] : undefined;
  }

  operationData.foundItem = foundItem;
  operationData.foundIndex = foundIndex;

  removeProperties(operationData, 'findProperty', 'findValue', 'findPredicate');

  return operationData;
};
