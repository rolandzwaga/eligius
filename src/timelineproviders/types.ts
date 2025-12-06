export type TPlayState = 'stopped' | 'running';

/**
 * Timeline provider interface with async start
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
