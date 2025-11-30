import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export type ScrollBehavior = 'auto' | 'smooth';

export interface IScrollToPositionOperationData {
  /**
   * @required
   * @erased
   */
  x: number;
  /**
   * @required
   * @erased
   */
  y: number;
  /**
   * @optional
   * @erased
   */
  behavior?: ScrollBehavior;
}

/**
 * Scrolls the viewport to a specific x,y coordinate position.
 *
 * Uses the browser's `window.scrollTo` API with configurable behavior.
 *
 * @returns Operation data with scroll properties erased
 *
 * @example
 * ```typescript
 * // Smooth scroll to position
 * const result = scrollToPosition({
 *   x: 0,
 *   y: 500,
 *   behavior: 'smooth'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Instant scroll to top
 * const result = scrollToPosition({
 *   x: 0,
 *   y: 0
 * });
 * ```
 *
 * @category Scroll
 */
export const scrollToPosition: TOperation<
  IScrollToPositionOperationData,
  Omit<IScrollToPositionOperationData, 'x' | 'y' | 'behavior'>
> = (operationData: IScrollToPositionOperationData) => {
  const {x, y, behavior = 'auto'} = operationData;

  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('scrollToPosition: x and y coordinates are required');
  }

  window.scrollTo({
    left: x,
    top: y,
    behavior,
  });

  removeProperties(operationData, 'x', 'y', 'behavior');

  return operationData;
};
