import type {TOperation} from './types.ts';

export interface IGetScrollPositionOperationData {
  /**
   * @output
   */
  scrollX: number;
  /**
   * @output
   */
  scrollY: number;
}

/**
 * Gets the current scroll position of the viewport.
 *
 * Returns x (horizontal) and y (vertical) scroll positions in pixels.
 * Uses cross-browser compatible methods to retrieve scroll position.
 *
 * @returns Operation data with `scrollX` and `scrollY` values
 *
 * @example
 * ```typescript
 * // Get current scroll position
 * const result = getScrollPosition({});
 * // result.scrollX = 150
 * // result.scrollY = 400
 * ```
 *
 * @category Scroll
 */
export const getScrollPosition: TOperation<
  IGetScrollPositionOperationData,
  IGetScrollPositionOperationData
> = (operationData: IGetScrollPositionOperationData) => {
  // Cross-browser scroll position detection
  const scrollX =
    window.pageXOffset !== undefined
      ? window.pageXOffset
      : (window as any).scrollX !== undefined
        ? (window as any).scrollX
        : document.documentElement?.scrollLeft || 0;

  const scrollY =
    window.pageYOffset !== undefined
      ? window.pageYOffset
      : (window as any).scrollY !== undefined
        ? (window as any).scrollY
        : document.documentElement?.scrollTop || 0;

  operationData.scrollX = scrollX;
  operationData.scrollY = scrollY;

  return operationData;
};
