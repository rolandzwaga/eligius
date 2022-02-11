import { TOperation } from './types';

/**
 * This operation logs the current operation data and context.
 *
 * @param operationData
 * @returns
 */
export const log: TOperation = function (operationData: unknown) {
  console.group('Operation info');
  console.dir({ context: this });
  console.dir({ operationData });
  console.groupEnd();
  return operationData;
};
