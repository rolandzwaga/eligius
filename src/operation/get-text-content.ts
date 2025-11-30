import type {TOperation} from '@operation/types.ts';

export interface IGetTextContentOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @output
   */
  textContent?: string;
}

/**
 * Extracts text content from element, stripping all HTML markup.
 *
 * Uses jQuery's `.text()` method which is XSS-safe and returns only the text content
 * without any HTML tags. Preserves whitespace and text from nested elements.
 *
 * @returns Operation data with `textContent` containing the extracted plain text
 *
 * @example
 * ```typescript
 * // Extract text from element with HTML
 * const result = getTextContent({selectedElement: $div});
 * // Given: <div>Hello <strong>World</strong>!</div>
 * // Returns: {textContent: "Hello World!"}
 * ```
 *
 * @category Text
 */
export const getTextContent: TOperation<
  IGetTextContentOperationData,
  IGetTextContentOperationData
> = (operationData: IGetTextContentOperationData) => {
  const {selectedElement} = operationData;

  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('getTextContent: selectedElement is required');
  }

  operationData.textContent = selectedElement.text();

  return operationData;
};
