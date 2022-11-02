import { TOperation } from './types';

export const otherwise: TOperation<{}> = function (operationData: {}) {
  if (this.skipNextOperation === false) {
    this.skipNextOperation = true;
  }
  return operationData;
};
