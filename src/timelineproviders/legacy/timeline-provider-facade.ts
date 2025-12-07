import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
  ISeekable,
  ITimelineProvider,
  TBoundary,
  TPlayState,
} from '@timelineproviders/types.ts';
import {isSeekable} from '@timelineproviders/types.ts';

/**
 * Configuration for TimelineProviderFacade.
 */
export interface TimelineProviderFacadeConfig {
  /**
   * The position source to wrap.
   * May optionally implement ISeekable for seek support.
   */
  positionSource: IPositionSource;

  /**
   * Optional container provider.
   * If not provided, getContainer() returns undefined.
   */
  containerProvider?: IContainerProvider;

  /**
   * Optional playlist for multi-item timelines.
   * If not provided, playlistItem() is a no-op.
   */
  playlist?: IPlaylist;
}

/**
 * Backwards-compatible facade for the legacy ITimelineProvider interface.
 *
 * Wraps the new decomposed interfaces (IPositionSource, ISeekable, IContainerProvider,
 * IPlaylist) and exposes them through the legacy ITimelineProvider interface.
 *
 * This allows existing code using ITimelineProvider to work with the new
 * decomposed architecture without modification.
 *
 * @example
 * ```typescript
 * // Create decomposed components
 * const positionSource = new RafPositionSource({ duration: 60 });
 * const containerProvider = new DomContainerProvider({ selector: '#app' });
 *
 * // Wrap in facade for legacy compatibility
 * const facade = new TimelineProviderFacade({
 *   positionSource,
 *   containerProvider,
 * });
 *
 * // Use legacy API
 * await facade.init();
 * await facade.start();
 * facade.onTime((pos) => console.log(pos));
 * ```
 */
export class TimelineProviderFacade implements ITimelineProvider {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _positionSource: IPositionSource;
  private readonly _containerProvider?: IContainerProvider;
  private readonly _playlist?: IPlaylist;
  private readonly _seekable?: ISeekable;

  // Callbacks
  private _onTimeCallback?: (position: number) => void;
  private _onCompleteCallback?: () => void;
  private _onRestartCallback?: () => void;
  private _onFirstFrameCallback?: () => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new timeline provider facade.
   *
   * @param config - Configuration options
   */
  constructor(config: TimelineProviderFacadeConfig) {
    this._positionSource = config.positionSource;
    this._containerProvider = config.containerProvider;
    this._playlist = config.playlist;

    // Check if source is seekable
    if (isSeekable(this._positionSource)) {
      this._seekable = this._positionSource;
    }

    // Wire up internal event forwarding
    this._setupEventForwarding();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITimelineProvider - State
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the current play state.
   *
   * Maps TSourceState to TPlayState:
   * - active -> running
   * - suspended -> paused
   * - inactive -> stopped
   */
  get playState(): TPlayState {
    const state = this._positionSource.state;
    switch (state) {
      case 'active':
        return 'running';
      case 'suspended':
        return 'paused';
      default:
        return 'stopped';
    }
  }

  /**
   * Get/set the loop property.
   *
   * Delegates to the position source.
   */
  get loop(): boolean {
    return this._positionSource.loop;
  }

  set loop(value: boolean) {
    this._positionSource.loop = value;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITimelineProvider - Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize the facade.
   *
   * Delegates to the position source.
   */
  async init(): Promise<void> {
    await this._positionSource.init();
  }

  /**
   * Destroy the facade and release resources.
   *
   * Delegates to the position source.
   */
  destroy(): void {
    this._positionSource.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITimelineProvider - Playback
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start playback.
   *
   * Maps to position source activate().
   */
  async start(): Promise<void> {
    await this._positionSource.activate();
  }

  /**
   * Pause playback.
   *
   * Maps to position source suspend().
   */
  pause(): void {
    this._positionSource.suspend();
  }

  /**
   * Stop playback and reset position.
   *
   * Maps to position source deactivate().
   */
  stop(): void {
    this._positionSource.deactivate();
  }

  /**
   * Seek to a specific position.
   *
   * Delegates to ISeekable if available, otherwise returns current position.
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  async seek(position: number): Promise<number> {
    if (this._seekable) {
      return this._seekable.seek(position);
    }
    return this._positionSource.getPosition();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITimelineProvider - Playlist
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Switch to a playlist item.
   *
   * Delegates to playlist if available, otherwise no-op.
   *
   * @param uri - Timeline URI
   */
  playlistItem(uri: string): void {
    this._playlist?.selectItem(uri);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITimelineProvider - State Queries
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get current position.
   *
   * Delegates to position source.
   */
  getPosition(): number {
    return this._positionSource.getPosition();
  }

  /**
   * Get duration.
   *
   * Delegates to position source.
   */
  getDuration(): number {
    return this._positionSource.getDuration();
  }

  /**
   * Get container element.
   *
   * Delegates to container provider if available.
   */
  getContainer(): JQuery<HTMLElement> | undefined {
    return this._containerProvider?.getContainer();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITimelineProvider - Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register time update callback.
   *
   * Maps to position source onPosition().
   */
  onTime(callback: (position: number) => void): void {
    this._onTimeCallback = callback;
  }

  /**
   * Register playback complete callback.
   *
   * Called when end boundary reached and not looping.
   */
  onComplete(callback: () => void): void {
    this._onCompleteCallback = callback;
  }

  /**
   * Register restart/loop callback.
   *
   * Called when end boundary reached and looping.
   */
  onRestart(callback: () => void): void {
    this._onRestartCallback = callback;
  }

  /**
   * Register first frame callback.
   *
   * Maps to container provider onContainerReady().
   */
  onFirstFrame(callback: () => void): void {
    this._onFirstFrameCallback = callback;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set up event forwarding from decomposed components.
   */
  private _setupEventForwarding(): void {
    // Forward position updates
    this._positionSource.onPosition(position => {
      this._onTimeCallback?.(position);
    });

    // Forward boundary events
    this._positionSource.onBoundaryReached((boundary: TBoundary) => {
      if (boundary === 'end') {
        if (this._positionSource.loop) {
          this._onRestartCallback?.();
        } else {
          this._onCompleteCallback?.();
        }
      }
    });

    // Forward container ready
    this._containerProvider?.onContainerReady(() => {
      this._onFirstFrameCallback?.();
    });
  }
}
