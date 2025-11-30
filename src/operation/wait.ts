import {internalResolve} from '@operation/helper/internal-resolve.ts';
import type {TOperation} from '@operation/types.ts';

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
 *
 * @category Utility
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
