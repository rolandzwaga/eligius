import { getGlobals } from './helper/globals';
import { TOperation, TOperationData } from './types';

/**
 * This operation logs the current operation data, global data and context to the console.
 *
 * @param operationData
 * @returns
 */
export const log: TOperation<TOperationData> = function (
  operationData: TOperationData
) {
  const globalData = getGlobals();

  console.group('Operation info');
  console.log('context', this);
  console.log('operationData', operationData);
  console.log('globalData', globalData);
  console.groupEnd();
  return operationData;
};
