import type {IResolvedOperation} from '@configuration/types.ts';
import {
  endWhenSystemName,
  otherwiseSystemName,
  whenSystemName,
} from '@operation/helper/flow-control-names.ts';

/**
 * Forward scans over an operation list that find the end of a control-flow
 * block. They allocate nothing and are shared by `when`, `otherwise`,
 * `forEach` and the loop jumps, so every block boundary is found by one
 * algorithm.
 */

/**
 * Finds the operation a false `when` continues at: the first `otherwise` or
 * `endWhen` at the same nesting depth after `start`. Only `when` and
 * `endWhen` change the depth.
 *
 * @param operations The operation list of the action
 * @param start The index the scan starts at (the operation after the `when`)
 * @returns The index of the `otherwise` or `endWhen`, or `operations.length`
 * when the block is not closed
 */
export function findNextFlowControlIndex(
  operations: readonly IResolvedOperation[],
  start: number
): number {
  let depth = 0;
  for (let index = start; index < operations.length; index++) {
    const {systemName} = operations[index];
    if (systemName === whenSystemName) {
      depth++;
    } else if (systemName === endWhenSystemName) {
      if (depth === 0) {
        return index;
      }
      depth--;
    } else if (systemName === otherwiseSystemName && depth === 0) {
      return index;
    }
  }
  return operations.length;
}

/**
 * Finds the `close` operation that matches an `open` operation: the first
 * `close` at nesting depth zero after `start`, where every `open` seen on
 * the way opens one more level.
 *
 * @param operations The operation list of the action
 * @param start The index the scan starts at (the operation after the opener)
 * @param open The system name that opens a block, for example `when`
 * @param close The system name that closes it, for example `endWhen`
 * @returns The index of the matching `close`, or -1 when there is none
 */
export function findMatchingEndIndex(
  operations: readonly IResolvedOperation[],
  start: number,
  open: string,
  close: string
): number {
  let depth = 0;
  for (let index = start; index < operations.length; index++) {
    const {systemName} = operations[index];
    if (systemName === open) {
      depth++;
    } else if (systemName === close) {
      if (depth === 0) {
        return index;
      }
      depth--;
    }
  }
  return -1;
}
