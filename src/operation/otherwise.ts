import { IOperationContext, TOperation } from './types';

export const otherwise: TOperation<{}> = function (operationData: {}) {
  if (this.whenEvaluation) {
    this.newIndex = findEndWhenIndex(this);
  }
  return operationData;
};

function findEndWhenIndex(context: IOperationContext) {
  const list = context.operations.slice(context.currentIndex);

  const endWhenIndex = list.findIndex((x) => x.systemName === 'endWhen');
  if (endWhenIndex > -1) {
    return endWhenIndex + context.currentIndex;
  }

  return context.operations.length;
}
