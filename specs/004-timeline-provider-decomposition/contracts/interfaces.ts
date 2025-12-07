/**
 * Timeline Provider Decomposition - Interface Contracts
 *
 * This file defines the TypeScript interfaces for the decomposed
 * timeline provider architecture. These are reference contracts
 * for implementation.
 *
 * @see ../spec.md for requirements
 * @see ../data-model.md for entity relationships
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Position source lifecycle state.
 */
export type TSourceState = 'active' | 'suspended' | 'inactive';

/**
 * Boundary event type.
 */
export type TBoundary = 'start' | 'end';

// =============================================================================
// IPositionSource
// =============================================================================

/**
 * Core interface for timeline position sources.
 *
 * A position source provides the current position within a timeline and emits
 * position updates. The source of position can vary: elapsed time (RAF),
 * media playback (video), scroll position, mouse position, external data, etc.
 */
export interface IPositionSource {
  /** Current lifecycle state */
  readonly state: TSourceState;

  /** Whether to loop when reaching end boundary */
  loop: boolean;

  // Lifecycle
  init(): Promise<void>;
  destroy(): void;

  // Transport
  activate(): Promise<void>;
  suspend(): void;
  deactivate(): void;

  // Position
  getPosition(): number;
  getDuration(): number;

  // Events
  onPosition(callback: (position: number) => void): void;
  onBoundaryReached(callback: (boundary: TBoundary) => void): void;
}

// =============================================================================
// ISeekable
// =============================================================================

/**
 * Optional interface for position sources that support seeking.
 */
export interface ISeekable {
  /**
   * Seek to a specific position.
   * @param position - Target position
   * @returns Actual position after seek (may differ if clamped)
   */
  seek(position: number): Promise<number>;
}

/**
 * Type guard to check if a position source is seekable.
 */
export function isSeekable(
  source: IPositionSource
): source is IPositionSource & ISeekable {
  return 'seek' in source && typeof (source as ISeekable).seek === 'function';
}

// =============================================================================
// IPlaylist
// =============================================================================

/**
 * Interface for managing timeline item collections.
 */
export interface IPlaylist<TItem = unknown> {
  /** Currently active item */
  readonly currentItem: TItem;

  /** All items in the playlist */
  readonly items: readonly TItem[];

  /**
   * Select a playlist item by identifier.
   * @throws If no item matches the identifier
   */
  selectItem(identifier: string): void;

  /** Register callback for item changes */
  onItemChange(callback: (item: TItem) => void): void;
}

// =============================================================================
// IContainerProvider
// =============================================================================

/**
 * Interface for DOM container access.
 */
export interface IContainerProvider {
  /** Get container element */
  getContainer(): JQuery<HTMLElement> | undefined;

  /** Register callback for container ready */
  onContainerReady(callback: () => void): void;
}

// =============================================================================
// Legacy Interface (for reference)
// =============================================================================

/** @deprecated Use TSourceState instead */
export type TPlayState = 'stopped' | 'running' | 'paused';

/**
 * Legacy timeline provider interface.
 * @deprecated Use decomposed interfaces instead
 */
export interface ITimelineProvider {
  readonly playState: TPlayState;
  loop: boolean;

  init(): Promise<void>;
  destroy(): void;

  start(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(position: number): Promise<number>;

  playlistItem(uri: string): void;

  getPosition(): number;
  getDuration(): number;
  getContainer(): JQuery<HTMLElement> | undefined;

  onTime(callback: (position: number) => void): void;
  onComplete(callback: () => void): void;
  onRestart(callback: () => void): void;
  onFirstFrame(callback: () => void): void;
}

// =============================================================================
// Configuration Extensions
// =============================================================================

/**
 * Extended timeline configuration with position source options.
 */
export interface ITimelineConfigurationExtension {
  /** Container selector (optional, defaults to timeline selector) */
  container?: string;

  /** Position source type */
  positionSource?: 'raf' | 'video' | 'scroll';
}
