import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export type ScrollBehavior = 'auto' | 'smooth';
export type ScrollLogicalPosition = 'start' | 'center' | 'end' | 'nearest';

export interface IScrollToElementOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @optional
   * @erased
   */
  behavior?: ScrollBehavior;
  /**
   * @optional
   * @erased
   */
  block?: ScrollLogicalPosition;
  /**
   * @optional
   * @erased
   */
  inline?: ScrollLogicalPosition;
}

/**
 * Scrolls the viewport to bring the selected element into view.
 *
 * Uses the browser's `scrollIntoView` API with configurable behavior.
 *
 * @returns Operation data with scroll properties erased
 *
 * @example
 * ```typescript
 * // Smooth scroll to element at top of viewport
 * const result = scrollToElement({
 *   selectedElement: $targetElement,
 *   behavior: 'smooth',
 *   block: 'start'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Center element in viewport
 * const result = scrollToElement({
 *   selectedElement: $targetElement,
 *   behavior: 'smooth',
 *   block: 'center'
 * });
 * ```
 *
 * @category Scroll
 */
export const scrollToElement: TOperation<
  IScrollToElementOperationData,
  Omit<IScrollToElementOperationData, 'behavior' | 'block' | 'inline'>
> = (operationData: IScrollToElementOperationData) => {
  const {
    selectedElement,
    behavior = 'auto',
    block = 'start',
    inline = 'nearest',
  } = operationData;

  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('scrollToElement: selectedElement is required');
  }

  const element = selectedElement[0];
  element.scrollIntoView({
    behavior,
    block,
    inline,
  });

  removeProperties(operationData, 'behavior', 'block', 'inline');

  return operationData;
};
