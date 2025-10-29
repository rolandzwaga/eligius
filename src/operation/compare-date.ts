import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface ICompareDateOperationData {
  /**
   * @required
   * @erased
   */
  date1: Date | string | number;
  /**
   * @required
   * @erased
   */
  date2: Date | string | number;
  /**
   * @output
   */
  comparison: number;
  /**
   * @output
   */
  isEqual: boolean;
  /**
   * @output
   */
  isBefore: boolean;
  /**
   * @output
   */
  isAfter: boolean;
}

/**
 * Compares two dates.
 * comparison: -1 (before), 0 (equal), 1 (after)
 *
 * @category Date
 */
export const compareDate: TOperation<
  ICompareDateOperationData,
  Omit<ICompareDateOperationData, 'date1' | 'date2'>
> = (operationData: ICompareDateOperationData) => {
  const {date1, date2} = operationData;

  if (!date1 || !date2) {
    throw new Error('compareDate: both dates are required');
  }

  const dateObj1 = date1 instanceof Date ? date1 : new Date(date1);
  const dateObj2 = date2 instanceof Date ? date2 : new Date(date2);

  if (Number.isNaN(dateObj1.getTime()) || Number.isNaN(dateObj2.getTime())) {
    throw new Error('compareDate: invalid date');
  }

  const time1 = dateObj1.getTime();
  const time2 = dateObj2.getTime();

  operationData.comparison = time1 < time2 ? -1 : time1 > time2 ? 1 : 0;
  operationData.isEqual = time1 === time2;
  operationData.isBefore = time1 < time2;
  operationData.isAfter = time1 > time2;

  removeProperties(operationData, 'date1', 'date2');

  return operationData;
};
