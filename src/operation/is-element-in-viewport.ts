import type {TOperation} from '@operation/types.ts';

export interface IIsElementInViewportOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @output
   */
  isInViewport: boolean;
}

/**
 * Checks if an element is currently visible within the viewport.
 *
 * Uses `getBoundingClientRect()` to determine if the element is within the viewport boundaries.
 *
 * @returns Operation data with `isInViewport` boolean indicating visibility
 *
 * @example
 * ```typescript
 * // Check if element is in view
 * const result = isElementInViewport({
 *   selectedElement: $targetElement
 * });
 * // result.isInViewport = true or false
 * ```
 *
 * @category DOM
 */
export const isElementInViewport: TOperation<
  IIsElementInViewportOperationData,
  IIsElementInViewportOperationData
> = (operationData: IIsElementInViewportOperationData) => {
  const {selectedElement} = operationData;

  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('isElementInViewport: selectedElement is required');
  }

  const element = selectedElement[0];
  const rect = element.getBoundingClientRect();

  const isInViewport =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth);

  operationData.isInViewport = isInViewport;

  return operationData;
};
