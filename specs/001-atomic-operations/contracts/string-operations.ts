/**
 * TypeScript interfaces for String Operations
 *
 * @packageDocumentation
 */

/**
 * Operation data for concatenateStrings operation.
 * Joins multiple string values.
 */
export interface IConcatenateStringsOperationData {
  /** Array of strings to concatenate */
  strings: string[];
  /** Separator to insert between strings */
  separator?: string;
  /** Joined string (output) */
  concatenated?: string;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for splitString operation.
 * Splits string into array.
 */
export interface ISplitStringOperationData {
  /** String to split */
  text: string;
  /** Delimiter to split on */
  delimiter: string | RegExp;
  /** Array of string parts (output) */
  parts?: string[];
  /** Number of parts (output) */
  count?: number;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for substringText operation.
 * Extracts substring from text.
 */
export interface ISubstringTextOperationData {
  /** Source string */
  text: string;
  /** Start index (inclusive) */
  start: number;
  /** End index (exclusive) - omit for end of string */
  end?: number;
  /** Extracted substring (output) */
  substring?: string;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for replaceString operation.
 * Replaces text using pattern.
 */
export interface IReplaceStringOperationData {
  /** Source string */
  text: string;
  /** Pattern to find */
  pattern: string | RegExp;
  /** Replacement text */
  replacement: string;
  /** Replace all occurrences or just first */
  replaceAll?: boolean;
  /** String after replacement (output) */
  result?: string;
  /** Number of replacements made (output) */
  replacementCount?: number;
  /** Error message if operation failed (output) */
  error?: string;
}
