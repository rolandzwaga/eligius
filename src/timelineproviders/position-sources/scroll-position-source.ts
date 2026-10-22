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
  /**
   * The last programmatic scroll: the scrollTop the browser settled on and
   * the exact position it was made for. While the element stays at that
   * offset, the source reports the exact position instead of recomputing it
   * from a pixel-snapped scrollTop, so a seek or loop reset is not followed
   * by a slightly different position from its own scroll event.
   */
  private _programmaticScroll: {scrollTop: number; position: number} | null =
    null;

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

    // Sync with the current scroll offset (restored scroll, a scroll while
    // inactive, a seek while inactive, or a stop/start cycle) instead of
    // waiting for the next event.
    const position = this._currentPosition();
    this._lastPosition = position;
    this._wasAtStart = position === 0;
    this.setPosition(position);
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
   * Position is clamped to the valid range [0, duration]. The scroll is
   * instant (never smooth, even under CSS `scroll-behavior: smooth`), so the
   * target position is reported synchronously in every state and the
   * browser's follow-up scroll event repeats it instead of sweeping through
   * intermediate positions. Seeking while inactive moves the scroll offset
   * too, so a later `activate()` starts at the requested position. Seeking
   * to the same position twice has no further effect.
   *
   * @param position - Target position in seconds (0 to duration)
   * @returns The clamped target position
   */
  async seek(position: number): Promise<number> {
    if (!this._element || this.isDestroyed) {
      return this.getPosition();
    }

    const duration = this._config.duration;
    const clampedPosition = Math.max(0, Math.min(position, duration));

    this._scrollInstantlyTo(clampedPosition);
    this.setPosition(clampedPosition);

    return clampedPosition;
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

    const position = this._currentPosition();
    const duration = this._config.duration;

    // Store last position for boundary detection
    const previousPosition = this._lastPosition;
    this._lastPosition = position;

    // Update position
    this.setPosition(position);

    // Check for end boundary
    if (position >= duration && previousPosition < duration) {
      this.emitBoundary('end');

      if (this.loop && this.state === 'active') {
        // Restart is a jump, not a backward scrub: report 0 and the start
        // boundary now, then move the offset instantly so no intermediate
        // positions replay the timeline's actions in reverse
        this.setPosition(0);
        this.emitBoundary('start');
        this._scrollInstantlyTo(0);
        return;
      }
    }

    // Check for start boundary (only if we were not already at start)
    if (position === 0 && previousPosition > 0 && !this._wasAtStart) {
      this.emitBoundary('start');
    }

    this._wasAtStart = position === 0;
  }

  /**
   * Scroll instantly to the offset for `position` and remember it, so the
   * resulting scroll event and a later activation report exactly `position`.
   *
   * The boundary bookkeeping is updated before scrolling, so a scroll event
   * delivered synchronously by the browser sees the new position as current.
   */
  private _scrollInstantlyTo(position: number): void {
    const element = this._element;
    if (!element) {
      return;
    }

    this._lastPosition = position;
    this._wasAtStart = position === 0;

    const duration = this._config.duration;
    const top =
      duration > 0 ? (position * this._getScrollableHeight()) / duration : 0;
    element.scrollTo({top, behavior: 'instant'});
    this._programmaticScroll = {scrollTop: element.scrollTop, position};
  }

  /**
   * The position for the current scroll offset: the exact position of the
   * last programmatic scroll while the element is still at that offset,
   * otherwise the position calculated from the offset.
   */
  private _currentPosition(): number {
    const programmatic = this._programmaticScroll;
    if (programmatic && this._element) {
      if (this._element.scrollTop === programmatic.scrollTop) {
        return programmatic.position;
      }
      this._programmaticScroll = null;
    }
    return this._calculatePosition();
  }

  /**
   * Calculate position from scroll percentage, clamped to [0, duration].
   *
   * scrollTop is fractional under browser zoom or high-DPI scaling and can
   * stop just short of the integer maximum, so anything within 1px of the
   * bottom counts as the end.
   */
  private _calculatePosition(): number {
    if (!this._element) {
      return 0;
    }

    const scrollTop = this._element.scrollTop;
    const scrollableHeight = this._getScrollableHeight();
    const duration = this._config.duration;

    if (scrollableHeight <= 0) {
      return 0;
    }

    if (scrollableHeight - scrollTop < 1) {
      return duration;
    }

    const position = (scrollTop / scrollableHeight) * duration;
    return Math.max(0, Math.min(position, duration));
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
