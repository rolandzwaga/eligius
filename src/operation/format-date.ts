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

const FORMAT_TOKENS = /YYYY|MM|DD|HH|mm|ss/g;

/**
 * Formats a date with a simple token pattern, in the local time zone.
 *
 * Supported tokens (every occurrence is replaced, other characters are kept as is):
 * - `YYYY`: four digit year
 * - `MM`: month, 01-12
 * - `DD`: day of the month, 01-31
 * - `HH`: hours, 00-23
 * - `mm`: minutes, 00-59
 * - `ss`: seconds, 00-59
 *
 * @throws When the date is missing or invalid.
 *
 * @example
 * ```typescript
 * formatDate({date: new Date(2024, 0, 5, 14, 5), format: 'HH:mm-HH:mm DD/MM/YYYY'});
 * // formattedDate = "14:05-14:05 05/01/2024"
 * ```
 *
 * @category Date
 */
export const formatDate: TOperation<
  IFormatDateOperationData,
  Omit<IFormatDateOperationData, 'format'>
> = (operationData: IFormatDateOperationData) => {
  const {date, format} = operationData;

  if (date == null || date === '') {
    throw new Error('formatDate: date is required');
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(dateObj.getTime())) {
    throw new Error('formatDate: invalid date');
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  const tokens: Record<string, string> = {
    YYYY: String(dateObj.getFullYear()),
    MM: pad(dateObj.getMonth() + 1),
    DD: pad(dateObj.getDate()),
    HH: pad(dateObj.getHours()),
    mm: pad(dateObj.getMinutes()),
    ss: pad(dateObj.getSeconds()),
  };

  // One pass, so a replaced value is never matched again as a token
  operationData.formattedDate = format.replace(
    FORMAT_TOKENS,
    token => tokens[token]
  );

  removeProperties(operationData, 'format');

  return operationData;
};
