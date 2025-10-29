import type {TOperation} from './types.ts';

export interface IGetCurrentTimeOperationData {
  /**
   * @output
   */
  timestamp: number;
  /**
   * @output
   */
  date: Date;
}

/**
 * Gets the current time as timestamp and Date object.
 *
 * @category Date
 */
export const getCurrentTime: TOperation<
  IGetCurrentTimeOperationData,
  IGetCurrentTimeOperationData
> = (operationData: IGetCurrentTimeOperationData) => {
  const now = new Date();
  operationData.timestamp = now.getTime();
  operationData.date = now;
  return operationData;
};
