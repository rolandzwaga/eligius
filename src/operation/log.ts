import { deepCopy } from './helper/deep-copy';
import { TOperation, TOperationData } from './types';

/**
 * This operation logs the current operation data and context.
 *
 * @param operationData
 * @returns
 */
export const log: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  console.group('Operation info');
  console.dir({ context: deepCopy(this) });
  console.dir({ operationData: deepCopy(operationData) });
  console.groupEnd();
  return operationData;
};
