import { TOperation } from './types';

/**
 * This operation cleans up after the {@link when}/{@link otherwise}/{@link endWhen} control flow ends.
 * 
 * @param operationData 
 * @returns 
 */
export const endWhen: TOperation<{}> = function (operationData: {}) {
  delete this.whenEvaluation;
  return operationData;
};
