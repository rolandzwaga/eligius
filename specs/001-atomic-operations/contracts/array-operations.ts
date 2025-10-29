/**
 * TypeScript interfaces for Array Operations
 *
 * @packageDocumentation
 */

/**
 * Operation data for filterArray operation.
 * Filters array by condition.
 */
export interface IFilterArrayOperationData {
  /** Property path to array in operation data */
  arrayPropertyPath: string;
  /** Expression to evaluate for each item (e.g., "item.category === 'weapon'") */
  filterExpression?: string;
  /** Alternative to expression - function that returns boolean */
  filterFunction?: (item: any, index?: number, array?: any[]) => boolean;
  /** Subset of items matching criteria (output) */
  filteredArray?: any[];
  /** Number of items in filtered array (output) */
  filteredCount?: number;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Sort order: ascending or descending.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Operation data for sortArray operation.
 * Sorts array by property or comparator.
 */
export interface ISortArrayOperationData {
  /** Property path to array in operation data */
  arrayPropertyPath: string;
  /** Property path to sort by (e.g., "score", "user.name") */
  sortKey?: string;
  /** Sort order (ascending or descending) */
  order?: SortOrder;
  /** Custom comparator function */
  comparator?: (a: any, b: any) => number;
  /** Sorted array (output) */
  sortedArray?: any[];
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for mapArray operation.
 * Transforms array items by applying transformation.
 */
export interface IMapArrayOperationData {
  /** Property path to array in operation data */
  arrayPropertyPath: string;
  /** Expression to evaluate for each item (e.g., "item.name") */
  mapExpression?: string;
  /** Alternative to expression - transformation function */
  mapFunction?: (item: any, index?: number, array?: any[]) => any;
  /** Transformed array (output) */
  mappedArray?: any[];
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for findInArray operation.
 * Finds first item matching search criteria.
 */
export interface IFindInArrayOperationData {
  /** Property path to array in operation data */
  arrayPropertyPath: string;
  /** Expression to evaluate for each item (e.g., "item.id === targetId") */
  searchExpression?: string;
  /** Alternative to expression - search function */
  searchFunction?: (item: any, index?: number, array?: any[]) => boolean;
  /** First matching item, null if not found (output) */
  foundItem?: any;
  /** Index of found item, -1 if not found (output) */
  foundIndex?: number;
  /** Error message if operation failed (output) */
  error?: string;
}
