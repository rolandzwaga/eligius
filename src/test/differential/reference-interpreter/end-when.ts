// PINNED COPY of src/operation/end-when.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import type {TOperation} from '@operation/types.ts';
import {continuePendingLoopJump} from './helper/loop-jump.ts';

/**
 * This operation cleans up after the {@link when}/{@link otherwise}/{@link endWhen} control flow ends.
 *
 * @category Control Flow
 */
export const endWhen: TOperation<Record<string, unknown>> = function (
  operationData: Record<string, unknown>
) {
  delete this.whenEvaluation;
  continuePendingLoopJump(this);
  return operationData;
};
