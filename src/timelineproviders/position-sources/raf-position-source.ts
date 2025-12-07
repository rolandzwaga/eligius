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
  private _startTimeOffset = 0;

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

    // Create new abort controller for this ticking session
    this._abortController = new AbortController();

    // Start the animation interval
    animationInterval(
      this._tickInterval,
      this._abortController.signal,
      this._onTick.bind(this)
    );
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

    return clampedPosition;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Handle a tick from animationInterval.
   *
   * The time parameter represents elapsed milliseconds since the animation
   * interval started. Position is calculated as (time - offset) / tickInterval.
   *
   * @param time - Elapsed time in milliseconds from animationInterval
   */
  private _onTick(time: number): void {
    // Skip if not active (safety check)
    if (this.state !== 'active') {
      return;
    }

    // Calculate new position based on elapsed time since start/reset
    // Position = (time - offset) / tickInterval
    const elapsedSinceStart = time - this._startTimeOffset;
    const newPosition = Math.floor(elapsedSinceStart / this._tickInterval);
    const duration = this.getDuration();

    // Check if we've reached or exceeded the end
    if (newPosition >= duration) {
      // Emit end boundary
      this.emitBoundary('end');

      if (this.loop) {
        // Update offset to current time for next loop iteration
        this._startTimeOffset = time;
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
