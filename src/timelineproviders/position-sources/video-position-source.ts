import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {IContainerProvider, ISeekable} from '@timelineproviders/types.ts';
import $ from 'jquery';
import type vjs from 'video.js';

// Under NodeNext resolution the typed default import of video.js is the
// CommonJS module object; the videojs function is its `default`.
type TVideojs = typeof vjs.default;

let videojsLoader: Promise<TVideojs> | null = null;

/**
 * Loads video.js, an optional peer dependency, on first use and caches it.
 * A failed load is not cached, so a later init can try again.
 *
 * @returns the videojs function
 * @throws when video.js cannot be imported
 */
function loadVideojs(): Promise<TVideojs> {
  videojsLoader ??= import('video.js').then(
    module => {
      // Depending on the bundler's CommonJS interop, the function is the
      // module's default export or sits one `default` deeper
      const exported = module.default as unknown as TVideojs & {
        default?: TVideojs;
      };
      return exported.default ?? exported;
    },
    (error: unknown) => {
      videojsLoader = null;
      throw new Error(
        "VideoPositionSource requires the optional peer dependency 'video.js'. Install it with: npm install video.js",
        {cause: error}
      );
    }
  );
  return videojsLoader;
}

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
   * Video sources to load. Required: `init()` rejects when neither this nor
   * `options.sources` is a non-empty array.
   */
  sources: VideoSource[];

  /**
   * Optional poster image URL, shown before playback starts.
   */
  poster?: string;

  /**
   * Optional video.js player options. They override the source's defaults,
   * `sources` and `poster`.
   */
  options?: Record<string, unknown>;
}

/**
 * Video.js-based position source.
 *
 * Wraps a video.js player to provide position updates based on video playback.
 * Implements `IPositionSource`, `ISeekable`, and `IContainerProvider`.
 *
 * video.js is an optional peer dependency. It is loaded with a dynamic
 * `import()` during the first `init()`, so applications that never create a
 * video timeline do not need it installed. `init()` rejects with an error
 * naming the package when it cannot be loaded.
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
  private _player: ReturnType<TVideojs> | null = null;
  private _videoElementId: string;
  private readonly _containerReadyCallbacks: Array<() => void> = [];
  private readonly _eventHandlers: Array<() => void> = [];
  private _containerReady = false;
  private _pendingInit: {
    resolve: () => void;
    reject: (error: unknown) => void;
  } | null = null;
  private readonly _pendingSeeks = new Set<(position: number) => void>();

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
    return new Promise<void>((resolve, reject) => {
      if ($(this._config.selector).length === 0) {
        reject(
          new Error(
            `VideoPositionSource: container not found for selector '${this._config.selector}'`
          )
        );
        return;
      }

      // Without a source the media element never fires 'canplay' or
      // 'error', so init would never settle
      const sources = this._getSources();
      if (!Array.isArray(sources) || sources.length === 0) {
        reject(
          new Error(
            "VideoPositionSource: 'sources' is required (an array of {src, type})"
          )
        );
        return;
      }

      const pendingInit = {resolve, reject};
      this._pendingInit = pendingInit;

      // Create video element in container
      this._createVideoElement();

      // Load video.js (asynchronous, so the element above is in the DOM by
      // the time the player is created), then initialize the player
      loadVideojs().then(
        videojsFactory => {
          if (this._pendingInit !== pendingInit) {
            // destroy() settled init while video.js was loading
            return;
          }
          try {
            this._createPlayer(videojsFactory);
          } catch (error) {
            this._settleInit(error);
          }
        },
        error => {
          if (this._pendingInit === pendingInit) {
            this._settleInit(error);
          }
        }
      );
    });
  }

  protected doDestroy(): void {
    // Settle pending promises; settling init also cancels a player creation
    // that is still waiting for video.js to load
    this._settleInit(
      new Error('VideoPositionSource: destroyed before init completed')
    );

    const position = this._player?.currentTime() ?? this.getPosition();
    for (const settleSeek of [...this._pendingSeeks]) {
      settleSeek(position);
    }

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

  protected async startTicking(): Promise<void> {
    // Video.js handles ticking via timeupdate event, so just start playback.
    // play() rejects when the browser blocks autoplay; activate() then
    // reverts the state and rethrows.
    await this._player?.play();
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
   * Resolves on 'seeked' with the position the player landed on. A seek
   * that cannot complete also settles, with the player's current time: on a
   * media 'error', when the media is reset ('emptied', for example by a new
   * load), or when the source is destroyed. Callers awaiting the seek (such
   * as the engine, which ignores position updates while seeking) are
   * therefore never left waiting.
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  async seek(position: number): Promise<number> {
    if (!this._player || this.isDestroyed) {
      return this.getPosition();
    }

    const player = this._player;
    return new Promise<number>(resolve => {
      let settled = false;
      const settle = (actualPosition: number) => {
        if (settled) {
          return;
        }
        settled = true;
        this._pendingSeeks.delete(settle);
        player.off('seeked', onSeeked);
        player.off('error', onAborted);
        player.off('emptied', onAborted);
        resolve(actualPosition);
      };

      const onSeeked = () => {
        if (settled) {
          return;
        }
        const actualPosition = this._player?.currentTime() ?? 0;
        this.setPosition(actualPosition);
        settle(actualPosition);
      };

      // The seek will never complete: settle with wherever the player is
      const onAborted = () => {
        settle(this._player?.currentTime() ?? this.getPosition());
      };

      // Settled by destroy() if the player goes away first
      this._pendingSeeks.add(settle);
      player.one('seeked', onSeeked);
      player.one('error', onAborted);
      player.one('emptied', onAborted);

      player.currentTime(position);
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
   * The container is ready once playback has started for the first time. If
   * it is already ready, the callback is invoked immediately.
   *
   * @param callback - Function called when container is ready
   */
  onContainerReady(callback: () => void): void {
    if (this._containerReady) {
      callback();
      return;
    }
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
   * Create the video.js player and settle the pending init on 'canplay'
   * (resolve) or 'error' (reject).
   *
   * @param videojsFactory - The loaded video.js function
   */
  private _createPlayer(videojsFactory: TVideojs): void {
    this._player = videojsFactory(
      this._videoElementId,
      {
        controls: false,
        controlBar: false,
        liveui: false,
        autoplay: false,
        preload: 'auto',
        loop: this.loop,
        sources: this._config.sources,
        ...(this._config.poster !== undefined
          ? {poster: this._config.poster}
          : {}),
        ...this._config.options,
      },
      () => {
        // Player ready callback (skipped if destroyed in the meantime)
        const player = this._player;
        if (!player) {
          return;
        }

        // Register event handlers
        this._addPlayerListener(
          'timeupdate',
          this._handleTimeUpdate.bind(this)
        );
        this._addPlayerListener('ended', this._handleEnded.bind(this));

        // video.js 8 has no player 'firstplay' event, so the first
        // 'playing' marks the container as ready
        player.one('playing', () => {
          this._notifyContainerReady();
        });

        player.one('error', () => {
          const mediaError = player.error?.();
          const sources = (this._getSources() ?? []).map(s => s.src).join(', ');
          this._settleInit(
            new Error(
              `VideoPositionSource: failed to load video (${sources})${
                mediaError?.message ? `: ${mediaError.message}` : ''
              }`
            )
          );
        });

        player.one('canplay', () => {
          this._settleInit();
        });

        player.load();
      }
    );
  }

  /**
   * The sources video.js will load: `options.sources` when given (options
   * override the defaults), otherwise the top-level `sources`.
   */
  private _getSources(): VideoSource[] | undefined {
    const fromOptions = this._config.options?.sources;
    return (fromOptions ?? this._config.sources) as VideoSource[] | undefined;
  }

  /**
   * Settle the pending init promise once: resolve without an error, reject
   * with one.
   */
  private _settleInit(error?: unknown): void {
    const pending = this._pendingInit;
    if (!pending) {
      return;
    }
    this._pendingInit = null;
    if (error === undefined) {
      pending.resolve();
    } else {
      pending.reject(error);
    }
  }

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

      // Continue playing. Nobody awaits this replay, so handle a rejection
      // here instead of leaving it unhandled.
      this._player?.play()?.catch(() => {});
    } else {
      // Deactivate
      this.deactivate();
    }
  }

  /**
   * Notify all container ready callbacks.
   */
  private _notifyContainerReady(): void {
    this._containerReady = true;
    const callbacks = [...this._containerReadyCallbacks];
    this._containerReadyCallbacks.length = 0;
    for (const callback of callbacks) {
      callback();
    }
  }
}
