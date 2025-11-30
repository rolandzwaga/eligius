import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IFormatDateOperationData {
  /**
   * @required
   * @dependency
   */
  date: Date | string | number;
  /**
   * @required
   * @erased
   */
  format: string;
  /**
   * @output
   */
  formattedDate: string;
}

/**
 * Formats a date using Intl.DateTimeFormat or simple patterns.
 *
 * @category Date
 */
export const formatDate: TOperation<
  IFormatDateOperationData,
  Omit<IFormatDateOperationData, 'format'>
> = (operationData: IFormatDateOperationData) => {
  const {date, format} = operationData;

  if (!date) {
    throw new Error('formatDate: date is required');
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(dateObj.getTime())) {
    throw new Error('formatDate: invalid date');
  }

  // Simple format patterns
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  let formatted = format;
  formatted = formatted.replace('YYYY', String(year));
  formatted = formatted.replace('MM', month);
  formatted = formatted.replace('DD', day);
  formatted = formatted.replace('HH', hours);
  formatted = formatted.replace('mm', minutes);
  formatted = formatted.replace('ss', seconds);

  operationData.formattedDate = formatted;

  removeProperties(operationData, 'format');

  return operationData;
};
