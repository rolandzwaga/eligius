import { TOperation } from './types';

export const log: TOperation = function(operationData: unknown) {
  console.group('Operation info');
  console.dir({ context: this });
  console.dir({ operationData });
  console.groupEnd();
  return operationData;
};
