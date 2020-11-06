import { TOperation } from '../action/types';
import internalResolve from './helper/internal-resolve';

export interface IWaitOperationData {
  milliseconds: number;
}

const wait: TOperation<IWaitOperationData> = function (operationData, _eventBus) {
  const { milliseconds } = operationData;
  return new Promise((resolve) => {
    setTimeout(() => {
      internalResolve(resolve, operationData);
    }, milliseconds);
  });
};

export default wait;
