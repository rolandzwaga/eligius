import {internalResolve} from './helper/internal-resolve.ts';
import type {TOperation} from './types.ts';

export interface IWaitOperationData {
  /**
   * The amount of milliseconds the operation will wait for.
   * @required
   * @erased
   */
  milliseconds: number;
}

/**
 * This operation waits for the specified amount of milliseconds.
 */
export const wait: TOperation<
  IWaitOperationData,
  Omit<IWaitOperationData, 'milliseconds'>
> = (operationData: IWaitOperationData) => {
  const {milliseconds, ...newOperationData} = operationData;

  return new Promise(resolve => {
    setTimeout(() => {
      internalResolve(resolve, newOperationData);
    }, milliseconds);
  });
};
