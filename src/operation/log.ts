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
  console.dir({ context: this });
  console.dir({ operationData });
  console.groupEnd();
  return operationData;
};
