import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {ISeekable} from '@timelineproviders/types.ts';
import {animationInterval} from '@util/animation-interval.ts';

/**
 * Configuration for RafPositionSource.
 */
export interface RafPositionSourceConfig {
  /**
   * Total duration in seconds.
   */
  duration: number;

  /**
   * Interval between position ticks in milliseconds.
   * @default 1000 (1 second)
   */
  tickInterval?: number;
}

/**
 * RequestAnimationFrame-based position source.
 *
 * Uses the `animationInterval` utility to emit position updates at a regular
 * interval (default: 1 second). Position increments by 1 per second, making
 * position values equivalent to elapsed seconds.
 *
 * Implements both `IPositionSource` (via `BasePositionSource`) and `ISeekable`.
 *
 * @example
 * ```typescript
 * const source = new RafPositionSource({ duration: 60 });
 * await source.init();
 *
 * source.onPosition((position) => {
 *   console.log(`Position: ${position}s`);
 * });
 *
 * source.onBoundaryReached((boundary) => {
 *   if (boundary === 'end') {
 *     console.log('Timeline complete');
 *   }
 * });
 *
 * await source.activate();
 *
 * // Seek to 30 seconds
 * await source.seek(30);
 * ```
 */
export class RafPositionSource extends BasePositionSource implements ISeekable {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _tickInterval: number;
  private _abortController: AbortController | null = null;
  /**
   * Position (in seconds) the source had when the current ticking session
   * started. Each tick adds the session's elapsed time to this value, so
   * resuming after suspend or seeking continues from the right place.
   */
  private _sessionStartPosition = 0;
  /**
   * Elapsed time (in milliseconds, as reported by animationInterval) at which
   * the current loop iteration began. Reset to the tick time on loop wrap.
   */
  private _sessionElapsedOffset = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new RAF-based position source.
   *
   * @param config - Configuration options
   */
  constructor(config: RafPositionSourceConfig) {
    super(config.duration);
    this._tickInterval = config.tickInterval ?? 1000;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BasePositionSource Implementation
  // ─────────────────────────────────────────────────────────────────────────

  protected doInit(): Promise<void> {
    // RAF-based source requires no async initialization
    return Promise.resolve();
  }

  protected doDestroy(): void {
    this._abortTicking();
  }

  protected startTicking(): void {
    // Emit initial position immediately
    this.setPosition(this.getPosition());
    this._startSession();
  }

  protected stopTicking(): void {
    this._abortTicking();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ISeekable Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Seek to a specific position.
   *
   * Position is clamped to the valid range [0, duration].
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek (may be clamped)
   */
  async seek(position: number): Promise<number> {
    // Clamp position to valid range
    const clampedPosition = Math.max(0, Math.min(position, this.getDuration()));

    // Update position (setPosition will emit callback if active)
    this.setPosition(clampedPosition);

    // While ticking, restart the session so the clock is anchored to the new
    // position instead of the next tick overwriting it.
    if (this.state === 'active') {
      this._abortTicking();
      this._startSession();
    }

    return clampedPosition;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start a ticking session anchored at the current position.
   */
  private _startSession(): void {
    this._sessionStartPosition = this.getPosition();
    this._sessionElapsedOffset = 0;

    // Create new abort controller for this ticking session
    this._abortController = new AbortController();

    // Start the animation interval
    animationInterval(
      this._tickInterval,
      this._abortController.signal,
      this._onTick.bind(this)
    );
  }

  /**
   * Handle a tick from animationInterval.
   *
   * The elapsed parameter is the time since the current ticking session
   * started. Position is the session start position plus the elapsed time,
   * floored to the precision determined by tickInterval.
   *
   * @param elapsed - Elapsed time in milliseconds from animationInterval
   */
  private _onTick(elapsed: number): void {
    // Skip if not active (safety check)
    if (this.state !== 'active') {
      return;
    }

    // Floor the elapsed time to the nearest tick boundary in milliseconds,
    // add the session start position, then convert to seconds. Working in
    // integer milliseconds avoids float drift such as 0.1 + 0.2.
    const elapsedThisIteration = elapsed - this._sessionElapsedOffset;
    const ticksElapsed = Math.floor(elapsedThisIteration / this._tickInterval);
    const positionMs =
      Math.round(this._sessionStartPosition * 1000) +
      ticksElapsed * this._tickInterval;
    const newPosition = positionMs / 1000;
    const duration = this.getDuration();

    // Check if we've reached or exceeded the end
    if (newPosition >= duration) {
      // Emit end boundary
      this.emitBoundary('end');

      if (this.loop) {
        // Next iteration starts at 0 from this tick onwards
        this._sessionElapsedOffset = elapsed;
        this._sessionStartPosition = 0;
        // Reset to start and emit start boundary
        this.setPosition(0);
        this.emitBoundary('start');
      } else {
        // Set position to duration and deactivate
        this.setPosition(duration);
        this.deactivate();
      }
    } else {
      // Normal position update
      this.setPosition(newPosition);
    }
  }

  /**
   * Abort the current ticking session.
   */
  private _abortTicking(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }
}
