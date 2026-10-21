import {continuePendingLoopJump} from '@operation/helper/loop-jump.ts';
import type {TOperation} from '@operation/types.ts';

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
