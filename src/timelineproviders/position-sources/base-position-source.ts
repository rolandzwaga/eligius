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
  private _destroyed = false;
  /**
   * Incremented by every activate(), suspend(), deactivate() and destroy().
   * An asynchronous activation only applies its outcome while the token it
   * took is still current, so a stale start cannot overwrite a newer one.
   */
  private _activationToken = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  private _positionCallbacks: Array<(position: number) => void> = [];
  private _boundaryCallbacks: Array<(boundary: TBoundary) => void> = [];
  private _activatedCallbacks: Array<() => void> = [];

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

  /**
   * Release the source.
   *
   * Destroy is terminal: afterwards `activate()` rejects, the built-in
   * sources ignore `seek()`, and every registered callback is dropped so the
   * source no longer keeps its consumers alive. A pending asynchronous
   * activation is superseded and will not call the activated callbacks.
   */
  destroy(): void {
    this._activationToken++;
    if (this._state === 'active') {
      this.stopTicking();
    }
    this._state = 'inactive';
    this._position = 0;
    this._destroyed = true;
    this._positionCallbacks = [];
    this._boundaryCallbacks = [];
    this._activatedCallbacks = [];
    this.doDestroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPositionSource - Transport
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start emitting positions.
   *
   * When `startTicking()` is asynchronous, its outcome only applies while no
   * later `activate()`, `suspend()`, `deactivate()` or `destroy()` has
   * superseded this call. A superseded activation resolves without touching
   * the state or calling the activated callbacks, even when its start failed.
   *
   * @throws when the source has been destroyed, or when a current (not
   * superseded) asynchronous start fails
   */
  async activate(): Promise<void> {
    if (this._destroyed) {
      throw new Error(
        `${this.constructor.name}: cannot activate a destroyed position source`
      );
    }

    if (this._state === 'active') {
      // Already active, no-op
      return;
    }

    const previousState = this._state;
    const token = ++this._activationToken;
    this._state = 'active';
    const started = this.startTicking();

    if (started) {
      // Asynchronous start (e.g. media playback). Activation only counts once
      // it has succeeded.
      try {
        await started;
      } catch (error) {
        if (token !== this._activationToken) {
          // Superseded while starting: the newer call owns the state
          return;
        }
        this._state = previousState;
        throw error;
      }

      if (token !== this._activationToken) {
        return;
      }
    }

    // Emit activated callbacks (first frame semantics)
    for (const callback of [...this._activatedCallbacks]) {
      this._invoke(callback, 'activated');
    }
  }

  suspend(): void {
    if (this._state !== 'active') {
      // Can only suspend from active state
      return;
    }

    this._activationToken++;
    this._state = 'suspended';
    this.stopTicking();
    // Position is preserved
  }

  deactivate(): void {
    if (this._state === 'inactive') {
      // Already inactive, no-op
      return;
    }

    this._activationToken++;
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

  /**
   * Register a position callback.
   *
   * @param callback - Called with each new position while active
   * @returns A function that unregisters the callback
   */
  onPosition(callback: (position: number) => void): () => void {
    this._positionCallbacks.push(callback);
    return () => {
      this._positionCallbacks = this._positionCallbacks.filter(
        registered => registered !== callback
      );
    };
  }

  /**
   * Register a boundary callback.
   *
   * @param callback - Called with 'start' or 'end' when a boundary is reached
   * @returns A function that unregisters the callback
   */
  onBoundaryReached(callback: (boundary: TBoundary) => void): () => void {
    this._boundaryCallbacks.push(callback);
    return () => {
      this._boundaryCallbacks = this._boundaryCallbacks.filter(
        registered => registered !== callback
      );
    };
  }

  /**
   * Register an activation callback.
   *
   * @param callback - Called each time an activation succeeds
   * @returns A function that unregisters the callback
   */
  onActivated(callback: () => void): () => void {
    this._activatedCallbacks.push(callback);
    return () => {
      this._activatedCallbacks = this._activatedCallbacks.filter(
        registered => registered !== callback
      );
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Protected - For Subclasses
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Whether `destroy()` has been called. Subclasses use it to ignore
   * transport calls such as `seek()` on a destroyed source.
   */
  protected get isDestroyed(): boolean {
    return this._destroyed;
  }

  /**
   * Set the current position and emit to callbacks.
   *
   * Only emits if the source is active. A callback that throws is logged and
   * stops neither the other callbacks nor the caller (for example a RAF
   * tick), so one failing consumer cannot freeze the clock.
   *
   * @param position - New position value
   */
  protected setPosition(position: number): void {
    this._position = position;
    if (this._state === 'active') {
      for (const callback of [...this._positionCallbacks]) {
        this._invoke(() => callback(position), 'position');
      }
    }
  }

  /**
   * Emit a boundary event to all registered callbacks.
   *
   * A callback that throws is logged and does not stop the others.
   *
   * @param boundary - The boundary type ('start' or 'end')
   */
  protected emitBoundary(boundary: TBoundary): void {
    for (const callback of [...this._boundaryCallbacks]) {
      this._invoke(() => callback(boundary), 'boundary');
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
   *
   * May return a promise when starting is asynchronous (for example media
   * playback). `activate()` then waits for it: if it rejects, the state
   * reverts to its previous value, the activated callbacks are not called,
   * and `activate()` rethrows the error. When a later transition supersedes
   * the activation before the promise settles, the outcome is ignored.
   */
  protected abstract startTicking(): void | Promise<void>;

  /**
   * Stop emitting position updates.
   *
   * Called when transitioning from `active` to `suspended` or `inactive`.
   * Override to stop timers, pause listening, etc.
   */
  protected abstract stopTicking(): void;

  // ─────────────────────────────────────────────────────────────────────────
  // Private
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run one consumer callback, isolating its failure from the source.
   */
  private _invoke(callback: () => void, kind: string): void {
    try {
      callback();
    } catch (error) {
      console.error(
        `${this.constructor.name}: error in ${kind} callback:`,
        error
      );
    }
  }
}
