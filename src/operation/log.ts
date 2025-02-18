import { getGlobals } from './helper/globals.ts';
import type { TOperation, TOperationData } from './types.ts';

/**
 * This operation logs the current operation data, global data and context to the console.
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
