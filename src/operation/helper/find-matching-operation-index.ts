import type {IResolvedOperation} from '../../configuration/types.ts';

/**
 * This function can be used to find the index of a matching closing operation within a list of operations.
 *
 * Assume the following array of operations:
 * ```ts
 * [
 *  {systemName:'name1'},       // index 0
 *  {systemName:'forEach'},   // index 1
 *    {systemName:'name2'},     // index 2
 *    {systemName:'forEach'}  // index 3
 *      {systemName:'name3'}    // index 4
 *    {systemName:'endForEach'}    // index 5
 *  {systemName:'endForEach'}      // index 6
 *  {systemName:'name3'}        // index 7
 * ]
 * ```
 *
 * Given the `forEach` instance at index 1, this function will return index 6. Given the `forEach` at index 3, it will yield index 5.
 *
 * Returns `true` when the given `operation.systemName` equals the specified `matchingName` and the current counter value is zero.
 *
 * If the `matchingName` matches `operation.systemName` but the counter is greater than zero, the counter is decremented.
 *
 * If the `operation.systemName` equals `self` (the name of the operation that requires to find its match), then counter is incremented.
 *
 * @param this
 * @param operation
 *
 */
export function findMatchingOperationIndex(
  this: {counter: number; self: string; matchingName: string},
  operation: IResolvedOperation
) {
  if (operation.systemName === this.self) {
    this.counter = this.counter + 1;
    return false;
  }

  if (operation.systemName === this.matchingName && this.counter === 0) {
    return true;
  }

  if (operation.systemName === this.matchingName && this.counter > 0) {
    this.counter = this.counter - 1;
  }

  return false;
}
