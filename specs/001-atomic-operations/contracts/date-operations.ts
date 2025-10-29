/**
 * TypeScript interfaces for Date Operations
 *
 * @packageDocumentation
 */

/**
 * Date format type.
 */
export type DateFormatType = 'iso' | 'epoch';

/**
 * Operation data for formatDate operation.
 * Formats date using pattern.
 */
export interface IFormatDateOperationData {
  /** Date to format (ISO string, timestamp, or Date object) */
  date: string | number | Date;
  /** Format pattern (e.g., 'YYYY-MM-DD', 'MMM D, YYYY') */
  format: string;
  /** Formatted date string (output) */
  formatted?: string;
  /** Error message if date invalid or format failed (output) */
  error?: string;
}

/**
 * Operation data for getCurrentTime operation.
 * Returns current timestamp.
 */
export interface IGetCurrentTimeOperationData {
  /** Output format: 'iso' for ISO 8601 string, 'epoch' for milliseconds */
  format?: DateFormatType;
  /** Current timestamp in requested format (output) */
  timestamp?: string | number;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for compareDate operation.
 * Compares two dates.
 */
export interface ICompareDateOperationData {
  /** First date to compare */
  date1: string | number | Date;
  /** Second date to compare */
  date2: string | number | Date;
  /** -1 if date1 < date2, 0 if equal, 1 if date1 > date2 (output) */
  comparison?: -1 | 0 | 1;
  /** Difference in milliseconds (date1 - date2) (output) */
  difference?: number;
  /** Error message if dates invalid (output) */
  error?: string;
}
