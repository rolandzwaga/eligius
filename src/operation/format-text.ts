import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export type TextTransformation =
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'titlecase'
  | 'trim';

export interface IFormatTextOperationData {
  /**
   * @dependency
   */
  textContent: string;
  /**
   * @required
   * @erased
   */
  transformation: TextTransformation;
  /**
   * @output
   */
  formattedText?: string;
}

/**
 * Transforms text using format operations: uppercase, lowercase, capitalize, titlecase, or trim.
 *
 * Operates on textContent passed from previous operations (e.g., getTextContent).
 *
 * Transformations:
 * - `uppercase`: Convert all characters to uppercase
 * - `lowercase`: Convert all characters to lowercase
 * - `capitalize`: Capitalize only the first letter
 * - `titlecase`: Capitalize first letter of each word
 * - `trim`: Remove leading and trailing whitespace
 *
 * @returns Operation data with `formattedText` containing the transformed text
 *
 * @example
 * ```typescript
 * // Convert to uppercase
 * const result = formatText({
 *   textContent: 'hello',
 *   transformation: 'uppercase'
 * });
 * // result.formattedText = "HELLO"
 * ```
 *
 * @example
 * ```typescript
 * // Title case
 * const result = formatText({
 *   textContent: 'hello world',
 *   transformation: 'titlecase'
 * });
 * // result.formattedText = "Hello World"
 * ```
 *
 * @category Text
 */
export const formatText: TOperation<
  IFormatTextOperationData,
  Omit<IFormatTextOperationData, 'transformation'>
> = (operationData: IFormatTextOperationData) => {
  const {textContent, transformation} = operationData;

  if (textContent === undefined || textContent === null) {
    throw new Error('formatText: textContent is required');
  }

  let text = textContent;

  switch (transformation) {
    case 'uppercase':
      text = text.toUpperCase();
      break;
    case 'lowercase':
      text = text.toLowerCase();
      break;
    case 'capitalize':
      text = text.charAt(0).toUpperCase() + text.slice(1);
      break;
    case 'titlecase':
      // A letter starts a word unless a letter, digit or apostrophe precedes it
      text = text.replace(/(?<![\p{L}\p{N}'’])\p{L}/gu, char =>
        char.toUpperCase()
      );
      break;
    case 'trim':
      text = text.trim();
      break;
    default:
      throw new Error(
        `formatText: unknown transformation type "${transformation}"`
      );
  }

  operationData.formattedText = text;

  removeProperties(operationData, 'transformation');

  return operationData;
};
