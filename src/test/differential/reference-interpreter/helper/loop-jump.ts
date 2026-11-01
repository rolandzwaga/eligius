// PINNED COPY of src/operation/helper/loop-jump.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {IOperationScope} from '@operation/types.ts';
import {clearLoopCollection} from '../for-each.ts';
import {endWhenSystemName, whenSystemName} from '../when.ts';

/**
 * The kind of loop jump requested by `breakForEach` or `continueForEach`.
 */
export type TLoopJump = 'break' | 'continue';

/**
 * Loop jumps that are still unwinding through enclosing `when` blocks, keyed by the
 * when-scope whose `endWhen` has to pass the jump on to its parent scope.
 */
const pendingLoopJumps = new WeakMap<IOperationScope, TLoopJump>();

/**
 * Performs a `break` or `continue` for the nearest enclosing `forEach` loop.
 *
 * When the operation runs directly in the loop scope, the jump targets the loop's
 * `endForEach` immediately. When it runs inside one or more `when` blocks, each of
 * those blocks pushed its own scope, and `Action` only pops a when-scope when it
 * executes the matching `endWhen`. So instead of jumping straight to `endForEach`
 * (which would leave the when-scopes on the stack) the jump goes to the enclosing
 * `endWhen`, and `continuePendingLoopJump` passes it on from there, one
 * `when` block at a time, until it reaches the loop scope.
 *
 * Outside a loop this does nothing.
 */
export function requestLoopJump(scope: IOperationScope, jump: TLoopJump) {
  const loopScope = findLoopScope(scope);
  if (!loopScope) {
    return;
  }

  if (loopScope === scope) {
    applyLoopJump(loopScope, jump);
    return;
  }

  jumpToEnclosingEndWhen(scope, loopScope, jump);
}

/**
 * Called by `endWhen`. If a loop jump is unwinding through the when-scope that is
 * about to be popped, passes it on to the parent scope, which becomes the top of the
 * scope stack once `Action` pops this one.
 */
export function continuePendingLoopJump(scope: IOperationScope) {
  const jump = pendingLoopJumps.get(scope);
  if (!jump) {
    return;
  }
  pendingLoopJumps.delete(scope);

  const parent = scope.parent;
  if (!parent) {
    return;
  }

  if (isLoopScope(parent)) {
    applyLoopJump(parent, jump);
    return;
  }

  const loopScope = findLoopScope(parent);
  if (loopScope) {
    jumpToEnclosingEndWhen(parent, loopScope, jump);
  }
}

function jumpToEnclosingEndWhen(
  scope: IOperationScope,
  loopScope: IOperationScope,
  jump: TLoopJump
) {
  const endWhenIndex = findEnclosingEndWhenIndex(scope);
  if (endWhenIndex === -1) {
    // Malformed block without an endWhen: nothing to unwind through, so jump
    // straight to the loop end from the current scope.
    applyLoopJump(loopScope, jump);
    scope.newIndex = loopScope.newIndex;
    delete loopScope.newIndex;
    return;
  }

  pendingLoopJumps.set(scope, jump);
  scope.newIndex = endWhenIndex;
}

function applyLoopJump(loopScope: IOperationScope, jump: TLoopJump) {
  loopScope.newIndex = loopScope.loopEndIndex;
  delete loopScope.currentItem;

  if (jump === 'break') {
    clearLoopCollection(loopScope);
    delete loopScope.loopIndex;
    delete loopScope.loopLength;
    delete loopScope.loopStartIndex;
    delete loopScope.loopEndIndex;
  }
}

function isLoopScope(scope: IOperationScope) {
  return scope.loopIndex !== undefined && scope.loopLength !== undefined;
}

function findLoopScope(scope: IOperationScope): IOperationScope | undefined {
  let current: IOperationScope | undefined = scope;
  while (current) {
    if (isLoopScope(current)) {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

/**
 * Returns the index of the `endWhen` that closes the `when` block the current
 * operation is in, skipping nested when/endWhen pairs, or -1 if there is none.
 */
function findEnclosingEndWhenIndex(scope: IOperationScope) {
  const {operations} = scope;
  let depth = 0;
  for (let i = scope.currentIndex + 1; i < operations.length; i++) {
    const {systemName} = operations[i];
    if (systemName === whenSystemName) {
      depth++;
    } else if (systemName === endWhenSystemName) {
      if (depth === 0) {
        return i;
      }
      depth--;
    }
  }
  return -1;
}
