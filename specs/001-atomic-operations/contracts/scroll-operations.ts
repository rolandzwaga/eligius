/**
 * TypeScript interfaces for Scroll Operations
 *
 * @packageDocumentation
 */

/**
 * Scroll behavior: smooth or instant.
 */
export type ScrollBehavior = 'smooth' | 'auto';

/**
 * Vertical alignment for scrollIntoView.
 */
export type ScrollBlock = 'start' | 'center' | 'end' | 'nearest';

/**
 * Operation data for scrollToElement operation.
 * Smoothly scrolls to element position.
 */
export interface IScrollToElementOperationData {
  /** CSS selector for target element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** Vertical offset in pixels (for sticky headers) */
  offset?: number;
  /** Scroll animation behavior */
  behavior?: ScrollBehavior;
  /** Vertical alignment */
  block?: ScrollBlock;
  /** True if scroll executed (output) */
  scrolled?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for scrollToPosition operation.
 * Scrolls to exact X/Y coordinates.
 */
export interface IScrollToPositionOperationData {
  /** Horizontal scroll position in pixels */
  x: number;
  /** Vertical scroll position in pixels */
  y: number;
  /** Scroll animation behavior */
  behavior?: ScrollBehavior;
  /** True if scroll executed (output) */
  scrolled?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for isElementInViewport operation.
 * Checks if element is visible in viewport.
 */
export interface IIsElementInViewportOperationData {
  /** CSS selector for element */
  selector?: string;
  /** Pre-selected element (jQuery) */
  selectedElement?: any;
  /** True if element visible in viewport (output) */
  inViewport?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for getScrollPosition operation.
 * Retrieves current scroll position.
 */
export interface IGetScrollPositionOperationData {
  /** Horizontal scroll position in pixels (output) */
  scrollX?: number;
  /** Vertical scroll position in pixels (output) */
  scrollY?: number;
  /** Error message if operation failed (output) */
  error?: string;
}
