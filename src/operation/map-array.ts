import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface IMapArrayOperationData {
  /**
   * @required
   * @dependency
   */
  arrayData: any[];
  /**
   * @required
   * @erased
   */
  mapFunction: (item: any, index?: number) => any;
  /**
   * @output
   */
  mappedArray?: any[];
}

/**
 * Transforms each element of an array using a mapping function.
 *
 * Operates on arrayData passed from previous operations.
 * The mapFunction receives each item and optionally its index.
 *
 * @returns Operation data with `mappedArray` containing transformed elements
 *
 * @example
 * ```typescript
 * // Double each number
 * const result = mapArray({
 *   arrayData: [1, 2, 3, 4],
 *   mapFunction: (item) => item * 2
 * });
 * // result.mappedArray = [2, 4, 6, 8]
 * ```
 *
 * @example
 * ```typescript
 * // Extract property from objects
 * const result = mapArray({
 *   arrayData: [{name: 'Alice', age: 25}, {name: 'Bob', age: 30}],
 *   mapFunction: (item) => item.name
 * });
 * // result.mappedArray = ['Alice', 'Bob']
 * ```
 *
 * @example
 * ```typescript
 * // Use index in transformation
 * const result = mapArray({
 *   arrayData: ['a', 'b', 'c'],
 *   mapFunction: (item, index) => `${index}-${item}`
 * });
 * // result.mappedArray = ['0-a', '1-b', '2-c']
 * ```
 *
 * @category Array
 */
export const mapArray: TOperation<
  IMapArrayOperationData,
  Omit<IMapArrayOperationData, 'mapFunction'>
> = (operationData: IMapArrayOperationData) => {
  const {arrayData, mapFunction} = operationData;

  if (!Array.isArray(arrayData)) {
    throw new Error('mapArray: arrayData is required and must be an array');
  }

  if (typeof mapFunction !== 'function') {
    throw new Error('mapArray: mapFunction is required and must be a function');
  }

  operationData.mappedArray = arrayData.map(mapFunction);

  removeProperties(operationData, 'mapFunction');

  return operationData;
};
