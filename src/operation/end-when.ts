import type {TOperation} from './types.ts';

/**
 * This operation cleans up after the {@link when}/{@link otherwise}/{@link endWhen} control flow ends.
 *
 * @category Control Flow
 */
export const endWhen: TOperation<Record<string, unknown>> = function (
  operationData: Record<string, unknown>
) {
  delete this.whenEvaluation;
  return operationData;
};
