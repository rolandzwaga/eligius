import type {
  IPositionSource,
  TBoundary,
  TSourceState,
} from '@timelineproviders/types.ts';

/**
 * Abstract base class for position sources.
 *
 * Provides shared state management, lifecycle handling, and callback
 * registration for concrete position source implementations.
 *
 * Subclasses must implement:
 * - `doInit()` - Source-specific initialization
 * - `doDestroy()` - Source-specific cleanup
 * - `startTicking()` - Start emitting position updates
 * - `stopTicking()` - Stop emitting position updates
 *
 * @example
 * ```typescript
 * class MyPositionSource extends BasePositionSource {
 *   protected doInit(): Promise<void> {
 *     // Initialize resources
 *     return Promise.resolve();
 *   }
 *
 *   protected doDestroy(): void {
 *     // Clean up resources
 *   }
 *
 *   protected startTicking(): void {
 *     // Start position updates
 *   }
 *
 *   protected stopTicking(): void {
 *     // Stop position updates
 *   }
 * }
 * ```
 */
export abstract class BasePositionSource implements IPositionSource {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private _state: TSourceState = 'inactive';
  private _position = 0;
  private readonly _duration: number;
  private _loop = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _positionCallbacks: Array<(position: number) => void> = [];
  private readonly _boundaryCallbacks: Array<(boundary: TBoundary) => void> =
    [];

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new position source.
   *
   * @param duration - Total duration in seconds (or `Infinity` for unbounded)
   */
  constructor(duration: number) {
    this._duration = duration;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPositionSource - State
  // ─────────────────────────────────────────────────────────────────────────

  get state(): TSourceState {
    return this._state;
  }

  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPositionSource - Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    await this.doInit();
  }

  destroy(): void {
    if (this._state === 'active') {
      this.stopTicking();
    }
    this._state = 'inactive';
    this._position = 0;
    this.doDestroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPositionSource - Transport
  // ─────────────────────────────────────────────────────────────────────────

  async activate(): Promise<void> {
    if (this._state === 'active') {
      // Already active, no-op
      return;
    }

    this._state = 'active';
    this.startTicking();
  }

  suspend(): void {
    if (this._state !== 'active') {
      // Can only suspend from active state
      return;
    }

    this._state = 'suspended';
    this.stopTicking();
    // Position is preserved
  }

  deactivate(): void {
    if (this._state === 'inactive') {
      // Already inactive, no-op
      return;
    }

    if (this._state === 'active') {
      this.stopTicking();
    }

    this._state = 'inactive';
    this._position = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPositionSource - Position
  // ─────────────────────────────────────────────────────────────────────────

  getPosition(): number {
    return this._position;
  }

  getDuration(): number {
    return this._duration;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPositionSource - Events
  // ─────────────────────────────────────────────────────────────────────────

  onPosition(callback: (position: number) => void): void {
    this._positionCallbacks.push(callback);
  }

  onBoundaryReached(callback: (boundary: TBoundary) => void): void {
    this._boundaryCallbacks.push(callback);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Protected - For Subclasses
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set the current position and emit to callbacks.
   *
   * Only emits if the source is active.
   *
   * @param position - New position value
   */
  protected setPosition(position: number): void {
    this._position = position;
    if (this._state === 'active') {
      for (const callback of this._positionCallbacks) {
        callback(position);
      }
    }
  }

  /**
   * Emit a boundary event to all registered callbacks.
   *
   * @param boundary - The boundary type ('start' or 'end')
   */
  protected emitBoundary(boundary: TBoundary): void {
    for (const callback of this._boundaryCallbacks) {
      callback(boundary);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Abstract - Must Implement
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Perform source-specific initialization.
   *
   * Called by `init()`. Override to load resources, bind listeners, etc.
   */
  protected abstract doInit(): Promise<void>;

  /**
   * Perform source-specific cleanup.
   *
   * Called by `destroy()`. Override to release resources, unbind listeners, etc.
   */
  protected abstract doDestroy(): void;

  /**
   * Start emitting position updates.
   *
   * Called when transitioning to `active` state.
   * Override to start timers, begin listening to events, etc.
   */
  protected abstract startTicking(): void;

  /**
   * Stop emitting position updates.
   *
   * Called when transitioning from `active` to `suspended` or `inactive`.
   * Override to stop timers, pause listening, etc.
   */
  protected abstract stopTicking(): void;
}
