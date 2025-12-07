import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {ISeekable} from '@timelineproviders/types.ts';
import $ from 'jquery';

/**
 * Configuration for ScrollPositionSource.
 */
export interface ScrollPositionSourceConfig {
  /**
   * CSS selector for the scrollable container element.
   */
  selector: string;

  /**
   * Duration in seconds that the scroll represents.
   * Position is calculated as: (scrollTop / scrollableHeight) * duration
   */
  duration: number;
}

/**
 * Scroll-based position source.
 *
 * Maps scroll position to a timeline position. The position is calculated
 * as a percentage of the scroll progress multiplied by the configured duration.
 *
 * Implements `IPositionSource` and `ISeekable`.
 *
 * @example
 * ```typescript
 * const source = new ScrollPositionSource({
 *   selector: '#scroll-container',
 *   duration: 100, // 100 seconds timeline
 * });
 *
 * await source.init();
 *
 * source.onPosition((position) => {
 *   console.log(`Scroll at ${position}s of 100s`);
 * });
 *
 * source.onBoundaryReached((boundary) => {
 *   if (boundary === 'end') {
 *     console.log('Scrolled to bottom');
 *   }
 * });
 *
 * await source.activate();
 * ```
 */
export class ScrollPositionSource
  extends BasePositionSource
  implements ISeekable
{
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _config: ScrollPositionSourceConfig;
  private _element: HTMLElement | null = null;
  private _boundScrollHandler: ((event: Event) => void) | null = null;
  private _lastPosition = 0;
  private _wasAtStart = true;

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new scroll-based position source.
   *
   * @param config - Configuration options
   */
  constructor(config: ScrollPositionSourceConfig) {
    super(config.duration);
    this._config = config;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BasePositionSource Implementation
  // ─────────────────────────────────────────────────────────────────────────

  protected doInit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const $element = $(this._config.selector);

      if ($element.length === 0) {
        reject(new Error(`Element not found: ${this._config.selector}`));
        return;
      }

      this._element = $element.get(0) as HTMLElement;
      resolve();
    });
  }

  protected doDestroy(): void {
    if (this._element && this._boundScrollHandler) {
      this._element.removeEventListener('scroll', this._boundScrollHandler, {
        passive: true,
      } as EventListenerOptions);
      this._boundScrollHandler = null;
    }
    this._element = null;
  }

  protected startTicking(): void {
    if (!this._element) {
      return;
    }

    this._boundScrollHandler = this._handleScroll.bind(this);
    this._element.addEventListener('scroll', this._boundScrollHandler, {
      passive: true,
    });
  }

  protected stopTicking(): void {
    if (this._element && this._boundScrollHandler) {
      this._element.removeEventListener('scroll', this._boundScrollHandler, {
        passive: true,
      } as EventListenerOptions);
      this._boundScrollHandler = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ISeekable Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Seek to a specific position by programmatically scrolling.
   *
   * @param position - Target position in seconds (0 to duration)
   * @returns Actual position after scroll
   */
  async seek(position: number): Promise<number> {
    if (!this._element || this.state === 'inactive') {
      return this.getPosition();
    }

    const scrollableHeight = this._getScrollableHeight();
    const targetScrollTop =
      (position / this._config.duration) * scrollableHeight;

    this._element.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });

    // Return the calculated position (actual may differ slightly due to smooth scrolling)
    return position;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Handle scroll events and update position.
   */
  private _handleScroll(_event: Event): void {
    if (this.state !== 'active' || !this._element) {
      return;
    }

    const position = this._calculatePosition();
    const duration = this._config.duration;

    // Store last position for boundary detection
    const previousPosition = this._lastPosition;
    this._lastPosition = position;

    // Update position
    this.setPosition(position);

    // Check for end boundary
    if (position >= duration && previousPosition < duration) {
      this.emitBoundary('end');

      if (this.loop) {
        // Reset to start
        this._element.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }

    // Check for start boundary (only if we were not already at start)
    if (position === 0 && previousPosition > 0 && !this._wasAtStart) {
      this.emitBoundary('start');
    }

    this._wasAtStart = position === 0;
  }

  /**
   * Calculate position from scroll percentage.
   */
  private _calculatePosition(): number {
    if (!this._element) {
      return 0;
    }

    const scrollTop = this._element.scrollTop;
    const scrollableHeight = this._getScrollableHeight();

    if (scrollableHeight <= 0) {
      return 0;
    }

    const scrollPercentage = scrollTop / scrollableHeight;
    return scrollPercentage * this._config.duration;
  }

  /**
   * Get the scrollable height (total scroll distance).
   */
  private _getScrollableHeight(): number {
    if (!this._element) {
      return 0;
    }

    return this._element.scrollHeight - this._element.clientHeight;
  }
}
