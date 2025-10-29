/**
 * TypeScript interfaces for Text Operations
 *
 * @packageDocumentation
 */

/**
 * Operation data for getTextContent operation.
 * Extracts text content from element (strips HTML).
 */
export interface IGetTextContentOperationData {
  /** CSS selector for element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** Extracted text without HTML markup (output) */
  textContent?: string;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for replaceText operation.
 * Finds and replaces text within element content.
 */
export interface IReplaceTextOperationData {
  /** CSS selector for element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** Text or regex pattern to find */
  searchPattern: string | RegExp;
  /** Replacement text */
  replacement: string;
  /** Text after replacement (output) */
  replacedText?: string;
  /** Number of replacements made (output) */
  replacementCount?: number;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Text transformation type.
 */
export type TextTransformation =
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'titlecase'
  | 'trim';

/**
 * Operation data for formatText operation.
 * Transforms text using format operations.
 */
export interface IFormatTextOperationData {
  /** CSS selector for element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** Transformation type */
  transformation: TextTransformation;
  /** Transformed text (output) */
  formattedText?: string;
  /** Error message if operation failed (output) */
  error?: string;
}
