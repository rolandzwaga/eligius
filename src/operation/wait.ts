import internalResolve from './helper/internalResolve';
import { TOperation } from '../action/types';

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
