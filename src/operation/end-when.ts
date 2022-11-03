import { TOperation } from './types';

export const endWhen: TOperation<{}> = function (operationData: {}) {
  delete this.whenEvaluation;
  return operationData;
};
