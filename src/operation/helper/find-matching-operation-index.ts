import { IResolvedOperation } from '../../configuration/types';

/**
 *
 *
 * @param this
 * @param operation
 * @returns
 */
export function findMatchingOperationIndex(
  this: { counter: number; self: string; matchingName: string },
  operation: IResolvedOperation
) {
  if (operation.systemName === this.self) {
    this.counter = this.counter + 1;
  }

  if (operation.systemName === this.matchingName && this.counter === 0) {
    return true;
  }

  if (operation.systemName === this.matchingName && this.counter > 0) {
    this.counter = this.counter - 1;
  }

  return false;
}
