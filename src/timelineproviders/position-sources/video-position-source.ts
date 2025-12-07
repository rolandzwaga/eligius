import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {IContainerProvider, ISeekable} from '@timelineproviders/types.ts';
import $ from 'jquery';
import vjs from 'video.js';

const videojs = vjs.default ?? vjs;

/**
 * Video source configuration for VideoPositionSource.
 */
export interface VideoSource {
  /**
   * URL of the video file.
   */
  src: string;

  /**
   * MIME type of the video (e.g., 'video/mp4').
   */
  type: string;
}

/**
 * Configuration for VideoPositionSource.
 */
export interface VideoPositionSourceConfig {
  /**
   * CSS selector for the container where the video player will be created.
   */
  selector: string;

  /**
   * Video sources to load.
   */
  sources: VideoSource[];

  /**
   * Optional video.js player options.
   */
  options?: Record<string, unknown>;
}

/**
 * Video.js-based position source.
 *
 * Wraps a video.js player to provide position updates based on video playback.
 * Implements `IPositionSource`, `ISeekable`, and `IContainerProvider`.
 *
 * @example
 * ```typescript
 * const source = new VideoPositionSource({
 *   selector: '#video-container',
 *   sources: [
 *     { src: 'video.mp4', type: 'video/mp4' },
 *     { src: 'video.webm', type: 'video/webm' },
 *   ],
 * });
 *
 * await source.init();
 *
 * source.onPosition((position) => {
 *   console.log(`Video at ${position}s`);
 * });
 *
 * source.onContainerReady(() => {
 *   console.log('Video ready for display');
 * });
 *
 * await source.activate();
 * ```
 */
export class VideoPositionSource
  extends BasePositionSource
  implements ISeekable, IContainerProvider
{
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _config: VideoPositionSourceConfig;
  private _player: ReturnType<typeof videojs> | null = null;
  private _videoElementId: string;
  private readonly _containerReadyCallbacks: Array<() => void> = [];
  private readonly _eventHandlers: Array<() => void> = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new video.js-based position source.
   *
   * @param config - Configuration options
   */
  constructor(config: VideoPositionSourceConfig) {
    // Duration starts at 0 and will be updated from video
    super(0);
    this._config = config;
    this._videoElementId = `video-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BasePositionSource Implementation
  // ─────────────────────────────────────────────────────────────────────────

  protected doInit(): Promise<void> {
    return new Promise<void>(resolve => {
      // Create video element in container
      this._createVideoElement();

      // Initialize video.js player
      setTimeout(() => {
        this._player = videojs(
          this._videoElementId,
          {
            controls: false,
            controlBar: false,
            liveui: false,
            autoplay: false,
            preload: 'auto',
            loop: this.loop,
            sources: this._config.sources,
            ...this._config.options,
          },
          () => {
            // Player ready callback
            if (this._player) {
              // Register event handlers
              this._addPlayerListener(
                'timeupdate',
                this._handleTimeUpdate.bind(this)
              );
              this._addPlayerListener('ended', this._handleEnded.bind(this));

              // Register one-time handlers
              this._player.one('firstplay', () => {
                this._notifyContainerReady();
              });

              this._player.one('canplay', () => {
                resolve();
              });

              this._player.load();
            }
          }
        );
      }, 0);
    });
  }

  protected doDestroy(): void {
    // Remove all event listeners
    for (const removeHandler of this._eventHandlers) {
      removeHandler();
    }
    this._eventHandlers.length = 0;

    // Dispose of player
    if (this._player) {
      this._player.dispose?.();
      this._player = null;
    }

    // Remove video element
    $(`#${this._videoElementId}`).remove();
  }

  protected startTicking(): void {
    // Video.js handles ticking via timeupdate event
    // Just start playback
    this._player?.play();
  }

  protected stopTicking(): void {
    // Pause the video
    this._player?.pause();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ISeekable Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Seek to a specific position in the video.
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  async seek(position: number): Promise<number> {
    if (!this._player) {
      return this.getPosition();
    }

    return new Promise<number>(resolve => {
      this._player!.one('seeked', () => {
        const actualPosition = this._player?.currentTime() ?? 0;
        this.setPosition(actualPosition);
        resolve(actualPosition);
      });

      this._player!.currentTime(position);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IContainerProvider Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the container element.
   *
   * @returns jQuery-wrapped container element
   */
  getContainer(): JQuery<HTMLElement> | undefined {
    return $(this._config.selector);
  }

  /**
   * Register a callback for when the container is ready.
   *
   * @param callback - Function called when container is ready
   */
  onContainerReady(callback: () => void): void {
    this._containerReadyCallbacks.push(callback);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Overrides
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the video duration.
   *
   * @returns Duration in seconds from video.js player
   */
  override getDuration(): number {
    return this._player?.duration() ?? 0;
  }

  /**
   * Deactivate the source and reset position.
   *
   * Overrides base to also reset video currentTime.
   */
  override deactivate(): void {
    if (this.state === 'inactive') {
      return;
    }

    if (this.state === 'active') {
      this.stopTicking();
    }

    // Reset video position
    this._player?.currentTime(0);

    // Call base class deactivate to update state
    super.deactivate();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create the video element in the container.
   */
  private _createVideoElement(): void {
    const $container = $(this._config.selector);
    const videoHtml = `<video id="${this._videoElementId}" class="video-js"></video>`;
    $container.append(videoHtml);
  }

  /**
   * Add an event listener to the player and track for cleanup.
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  private _addPlayerListener(
    event: string,
    handler: (...args: unknown[]) => void
  ): void {
    if (this._player) {
      this._player.on(event, handler);
      this._eventHandlers.push(() => {
        this._player?.off(event, handler);
      });
    }
  }

  /**
   * Handle timeupdate event from video.js.
   */
  private _handleTimeUpdate(): void {
    if (this.state !== 'active' || !this._player) {
      return;
    }

    const currentTime = this._player.currentTime();
    if (currentTime !== undefined) {
      this.setPosition(currentTime);
    }
  }

  /**
   * Handle ended event from video.js.
   */
  private _handleEnded(): void {
    if (this.state !== 'active') {
      return;
    }

    // Emit end boundary
    this.emitBoundary('end');

    if (this.loop) {
      // Reset position and emit start boundary
      this._player?.currentTime(0);
      this.setPosition(0);
      this.emitBoundary('start');

      // Continue playing
      this._player?.play();
    } else {
      // Deactivate
      this.deactivate();
    }
  }

  /**
   * Notify all container ready callbacks.
   */
  private _notifyContainerReady(): void {
    for (const callback of this._containerReadyCallbacks) {
      callback();
    }
  }
}
