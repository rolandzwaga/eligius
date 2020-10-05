import { IOperationContext, TOperation } from '../action/types';

const log: TOperation<never> = function (this: IOperationContext, operationData, _eventBus) {
  console.dir(this);
  console.dir(operationData);
  return operationData;
};

export default log;
