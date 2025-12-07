// =============================================================================
// LEGACY TYPES (maintained for backwards compatibility)
// =============================================================================

/** @deprecated Use TSourceState instead */
export type TPlayState = 'stopped' | 'running' | 'paused';

/**
 * Timeline provider interface with async start
 * @deprecated Use decomposed interfaces: IPositionSource, ISeekable, IPlaylist, IContainerProvider
 */
export interface ITimelineProvider {
  /** Current playback state */
  readonly playState: TPlayState;

  /** Whether timeline should loop */
  loop: boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  /** Initialize the provider */
  init(): Promise<void>;

  /** Destroy and clean up the provider */
  destroy(): void;

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYBACK
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start playback
   * @throws If playback cannot start (e.g., autoplay blocked)
   */
  start(): Promise<void>;

  /** Pause playback */
  pause(): void;

  /** Stop playback and reset position */
  stop(): void;

  /**
   * Seek to position
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  seek(position: number): Promise<number>;

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYLIST
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Switch to a playlist item by URI
   * @param uri - Timeline URI
   */
  playlistItem(uri: string): void;

  // ─────────────────────────────────────────────────────────────────────────
  // STATE QUERIES
  // ─────────────────────────────────────────────────────────────────────────

  /** Get current position in seconds */
  getPosition(): number;

  /** Get duration in seconds */
  getDuration(): number;

  /** Get container element */
  getContainer(): JQuery<HTMLElement> | undefined;

  // ─────────────────────────────────────────────────────────────────────────
  // CALLBACKS
  // ─────────────────────────────────────────────────────────────────────────

  /** Register time update callback */
  onTime(callback: (position: number) => void): void;

  /** Register playback complete callback */
  onComplete(callback: () => void): void;

  /** Register restart/loop callback */
  onRestart(callback: () => void): void;

  /** Register first frame callback */
  onFirstFrame(callback: () => void): void;
}

// =============================================================================
// DECOMPOSED INTERFACES (new model)
// =============================================================================

/**
 * Position source state.
 * - `active`: Source is emitting position updates
 * - `suspended`: Source is paused, position preserved
 * - `inactive`: Source is stopped, position reset to initial state
 */
export type TSourceState = 'active' | 'suspended' | 'inactive';

/**
 * Boundary type for position source events.
 * - `start`: Position reached the beginning (e.g., after reverse or loop)
 * - `end`: Position reached the end of duration
 */
export type TBoundary = 'start' | 'end';

// ─────────────────────────────────────────────────────────────────────────────
// IPositionSource
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core interface for timeline position sources.
 *
 * A position source provides the current position within a timeline and emits
 * position updates. The source of position can vary: elapsed time (RAF),
 * media playback (video), scroll position, mouse position, external data, etc.
 *
 * @example
 * ```typescript
 * // RAF-based position source
 * const source = new RafPositionSource(config);
 * await source.init();
 *
 * source.onPosition((position) => {
 *   console.log(`Current position: ${position}`);
 * });
 *
 * source.onBoundaryReached((boundary) => {
 *   if (boundary === 'end') console.log('Reached end');
 * });
 *
 * await source.activate();
 * ```
 */
export interface IPositionSource {
  // ───────────────────────────────────────────────────────────────────────────
  // STATE
  // ───────────────────────────────────────────────────────────────────────────

  /** Current state of the position source */
  readonly state: TSourceState;

  /**
   * Whether to loop when reaching the end boundary.
   *
   * When `true`, the source resets to position 0 and continues.
   * When `false`, the source emits `'end'` boundary and deactivates.
   *
   * For sources where looping is not applicable (e.g., mouse position),
   * this property has no effect.
   */
  loop: boolean;

  // ───────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Initialize the position source.
   *
   * Performs any async setup required before the source can be activated.
   * For example: loading media, binding event listeners, establishing connections.
   *
   * @throws If initialization fails (e.g., media load error, connection refused)
   */
  init(): Promise<void>;

  /**
   * Destroy the position source and release all resources.
   *
   * After calling destroy, the source cannot be reused.
   * Removes event listeners, closes connections, clears timers.
   */
  destroy(): void;

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSPORT
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Activate the position source to begin emitting position updates.
   *
   * Transitions state from `inactive` or `suspended` to `active`.
   *
   * @throws If activation fails (e.g., autoplay blocked, permission denied)
   */
  activate(): Promise<void>;

  /**
   * Suspend the position source, preserving current position.
   *
   * Transitions state from `active` to `suspended`.
   * Position updates stop but position is preserved for later resumption.
   */
  suspend(): void;

  /**
   * Deactivate the position source and reset to initial state.
   *
   * Transitions state to `inactive`.
   * Position is reset (typically to 0).
   */
  deactivate(): void;

  // ───────────────────────────────────────────────────────────────────────────
  // POSITION
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get the current position.
   *
   * @returns Current position in seconds (or source-specific units)
   */
  getPosition(): number;

  /**
   * Get the total duration.
   *
   * @returns Duration in seconds (or source-specific units), or `Infinity` for unbounded sources
   */
  getDuration(): number;

  // ───────────────────────────────────────────────────────────────────────────
  // EVENTS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Register a callback for position updates.
   *
   * Called whenever the position changes while the source is active.
   * Frequency depends on the source type (e.g., RAF tick, video timeupdate).
   *
   * @param callback - Function receiving the current position
   */
  onPosition(callback: (position: number) => void): void;

  /**
   * Register a callback for boundary events.
   *
   * Called when position reaches a boundary (start or end).
   * For looping sources, `'end'` is emitted before reset.
   *
   * @param callback - Function receiving the boundary type
   */
  onBoundaryReached(callback: (boundary: TBoundary) => void): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ISeekable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interface for position sources that support seeking to arbitrary positions.
 *
 * Not all position sources are seekable. For example:
 * - Seekable: RAF, video, scroll (programmatic), step-based
 * - Not seekable: mouse position, external WebSocket, live streams
 *
 * @example
 * ```typescript
 * if (isSeekable(source)) {
 *   const actualPosition = await source.seek(30.5);
 *   console.log(`Seeked to: ${actualPosition}`);
 * }
 * ```
 */
export interface ISeekable {
  /**
   * Seek to a specific position.
   *
   * @param position - Target position in seconds (or source-specific units)
   * @returns Actual position after seek (may differ from requested if clamped)
   */
  seek(position: number): Promise<number>;
}

/**
 * Type guard to check if a position source is seekable.
 *
 * @param source - Position source to check
 * @returns `true` if source implements ISeekable
 */
export function isSeekable(
  source: IPositionSource
): source is IPositionSource & ISeekable {
  return 'seek' in source && typeof (source as ISeekable).seek === 'function';
}

// ─────────────────────────────────────────────────────────────────────────────
// IPlaylist
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interface for managing a collection of timeline items.
 *
 * A playlist allows switching between multiple timeline configurations
 * (e.g., multiple videos, multiple animation sequences).
 *
 * @typeParam TItem - Type of playlist items (default: unknown)
 *
 * @example
 * ```typescript
 * playlist.onItemChange((item) => {
 *   console.log(`Switched to: ${item.uri}`);
 * });
 *
 * playlist.selectItem('chapter-2');
 * ```
 */
export interface IPlaylist<TItem = unknown> {
  /** Currently active playlist item */
  readonly currentItem: TItem;

  /** All items in the playlist */
  readonly items: readonly TItem[];

  /**
   * Select a playlist item by identifier.
   *
   * @param identifier - Unique identifier for the item (e.g., URI, ID)
   * @throws If no item matches the identifier
   */
  selectItem(identifier: string): void;

  /**
   * Register a callback for item changes.
   *
   * Called whenever the current item changes via `selectItem()`.
   *
   * @param callback - Function receiving the new current item
   */
  onItemChange(callback: (item: TItem) => void): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// IContainerProvider
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interface for providing the DOM container where content is rendered.
 *
 * The container is where operations render their output (elements, animations, etc.).
 * For some sources (video), the container is intrinsic. For others (WebSocket),
 * the container is a separate concern configured independently.
 *
 * @example
 * ```typescript
 * containerProvider.onContainerReady(() => {
 *   const $container = containerProvider.getContainer();
 *   $container?.append('<div class="content">Loaded!</div>');
 * });
 * ```
 */
export interface IContainerProvider {
  /**
   * Get the container element.
   *
   * @returns jQuery-wrapped container element, or `undefined` if not available
   */
  getContainer(): JQuery<HTMLElement> | undefined;

  /**
   * Register a callback for when the container is ready.
   *
   * Called once when the container becomes available and ready for content.
   * For video sources, this corresponds to the first frame.
   * For DOM containers, this is called after the element is found/created.
   *
   * @param callback - Function called when container is ready
   */
  onContainerReady(callback: () => void): void;
}
