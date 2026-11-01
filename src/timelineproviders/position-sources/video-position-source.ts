import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {IContainerProvider, ISeekable} from '@timelineproviders/types.ts';
import $ from 'jquery';

/**
 * Media source configuration for VideoPositionSource.
 */
export interface VideoSource {
  /**
   * URL of the media file.
   */
  src: string;

  /**
   * MIME type of the media (for example 'video/mp4', 'video/webm' or
   * 'audio/mpeg'). Written as the `type` attribute of the `<source>`
   * element; a source whose type the browser reports it cannot play is
   * left out without being requested.
   */
  type: string;
}

/**
 * Configuration for VideoPositionSource.
 */
export interface VideoPositionSourceConfig {
  /**
   * CSS selector for the container the video element is appended to. When
   * it matches several elements, the first one is used.
   */
  selector: string;

  /**
   * Media sources, in order of preference. Each becomes a `<source>` child
   * of the video element; the browser plays the first one it supports and
   * falls back to the next when one fails. Browser-playable media files
   * only (video or audio, for example MP4, WebM or MP3); HLS (.m3u8) and
   * DASH (.mpd) play only where the browser supports them natively.
   * Required: `init()` rejects when this is not a non-empty array.
   */
  sources: VideoSource[];

  /**
   * Optional poster image URL, shown until the first frame is available.
   */
  poster?: string;

  /**
   * Milliseconds `init()` waits for a source to become playable
   * (`canplay`) before it rejects. Guards against media the browser accepts
   * but never finishes loading or reports as failed. `0` disables the limit.
   *
   * @default 30000
   */
  loadTimeout?: number;
}

/** CSS class of the video element the source creates. */
const VIDEO_ELEMENT_CLASS = 'eligius-video';

/** HTMLMediaElement constants, without reading a global of one realm. */
const HAVE_NOTHING = 0;
const NETWORK_NO_SOURCE = 3;

/** Default of {@link VideoPositionSourceConfig.loadTimeout}. */
const DEFAULT_LOAD_TIMEOUT_MS = 30_000;

const OPTIONS_REMOVED_MESSAGE =
  "VideoPositionSource: 'options' is no longer supported (the video.js player options were removed in 4.0.0). Put 'sources' and 'poster' directly in the position source settings and delete 'options'.";

type TRemoveListener = () => void;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function createSourceElement(
  doc: Document,
  {src, type}: VideoSource
): HTMLSourceElement {
  const element = doc.createElement('source');
  element.src = src;
  // Without a type the browser sniffs the media; never write type="undefined"
  if (isNonEmptyString(type)) {
    element.type = type;
  }
  return element;
}

/**
 * jsdom has no `error` property at all, so read it defensively.
 */
function describeMediaError(error: MediaError | null | undefined): string {
  if (error?.message) {
    return `: ${error.message}`;
  }
  return error?.code !== undefined ? `: MediaError code ${error.code}` : '';
}

/**
 * Position source driven by a native HTML `<video>` element.
 *
 * `init()` creates `<video id="video-…" class="eligius-video" preload="auto"
 * playsinline>` with one `<source>` child per playable entry of `sources`,
 * and appends it to the first element matching `selector`. The element has
 * no controls and no styling: size it with CSS on `.eligius-video`. Host
 * code can reach it as `container.querySelector('video.eligius-video')`.
 *
 * Only browser-playable media files are supported (video or audio); there
 * is no HLS or DASH player. `init()` resolves on the first `canplay` and
 * rejects when no source can be played, on a media error, when no source
 * becomes playable within `loadTimeout` (30 s by default), when the
 * container or the sources are missing, when an entry has no `src`, or when
 * the removed `options` key is present. `getContainer()` returns the
 * selector's element. Browser autoplay policies may reject `activate()`
 * with a `NotAllowedError`.
 *
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
  private readonly _videoElementId: string;
  private _video: HTMLVideoElement | null = null;
  /** Only the appended (playable) source elements, in document order */
  private _sourceElements: HTMLSourceElement[] = [];
  private _initPromise: Promise<void> | null = null;
  private _pendingInit: {
    resolve: () => void;
    reject: (error: unknown) => void;
  } | null = null;
  /** timeupdate, ended, playing and seek listeners */
  private readonly _listeners = new Set<TRemoveListener>();
  /** canplay and the capture-phase error listener of a pending init */
  private readonly _initListeners = new Set<TRemoveListener>();
  private readonly _containerReadyCallbacks: Array<() => void> = [];
  private _containerReady = false;
  private readonly _pendingSeeks = new Set<(position: number) => void>();

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new video position source.
   *
   * @param config - Configuration options
   */
  constructor(config: VideoPositionSourceConfig) {
    // Duration starts at 0 and comes from the media once it is loaded
    super(0);
    this._config = config;
    this._videoElementId = `video-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BasePositionSource Implementation
  // ─────────────────────────────────────────────────────────────────────────

  protected doInit(): Promise<void> {
    // A pending or completed init is shared; a failed one is forgotten so
    // the engine's retry on next use starts clean
    this._initPromise ??= this._load().catch((error: unknown) => {
      this._initPromise = null;
      throw error;
    });
    return this._initPromise;
  }

  protected doDestroy(): void {
    // Reject a pending init (this also removes the init listeners)
    this._settleInit(
      new Error('VideoPositionSource: destroyed before init completed')
    );
    // A later init() must reach _load() and be refused
    this._initPromise = null;
    // Settle seeks, remove listeners, release the media
    this._teardown();
    // Drop the consumers' container-ready callbacks
    this._containerReadyCallbacks.length = 0;
  }

  protected async startTicking(): Promise<void> {
    // Position comes from 'timeupdate'; only playback needs starting.
    // play() rejects when the browser blocks autoplay (NotAllowedError);
    // activate() then reverts the state and rethrows. Awaiting undefined
    // (an environment whose play() returns no promise) is fine.
    await this._video?.play();
  }

  protected stopTicking(): void {
    this._video?.pause();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ISeekable Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Seek to a specific position in the media.
   *
   * Resolves on 'seeked' with the position the media landed on. A seek
   * that cannot complete also settles, with the media's current time: on a
   * media 'error' (also at a `<source>`), when the media is reset
   * ('emptied', for example by a new load), or when the source is
   * destroyed. Callers awaiting the seek (such as the engine, which ignores
   * position updates while seeking) are therefore never left waiting.
   *
   * Seeks that the media would never complete settle at once:
   * - before `init()` or after `destroy()`: with `getPosition()`;
   * - after a fatal media error, or when nothing is seekable: with the
   *   media's current time;
   * - before the media metadata is loaded: with the requested position,
   *   which the element keeps as the position playback starts from.
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  async seek(position: number): Promise<number> {
    const video = this._video;
    if (!video || this.isDestroyed) {
      return this.getPosition();
    }
    if (video.error) {
      // A fatal media error was already reported; no 'seeked', 'error' or
      // 'emptied' will follow
      return video.currentTime;
    }
    if (video.readyState === HAVE_NOTHING) {
      // No metadata: the element keeps the value as its default playback
      // start position, the getter returns it, and the real seek runs when
      // the metadata arrives
      video.currentTime = position;
      this.setPosition(position);
      return position;
    }
    if (video.seekable.length === 0) {
      // The HTML seek algorithm returns without firing 'seeked' when there
      // are no seekable ranges
      return video.currentTime;
    }

    return new Promise<number>(resolve => {
      let settled = false;
      const removers: TRemoveListener[] = [];
      const settle = (actualPosition: number) => {
        if (settled) {
          return;
        }
        settled = true;
        this._pendingSeeks.delete(settle);
        for (const remove of removers) {
          remove();
        }
        resolve(actualPosition);
      };

      const onSeeked = () => {
        const actualPosition = video.currentTime;
        this.setPosition(actualPosition);
        settle(actualPosition);
      };

      // The seek will never complete: settle with wherever the media is
      const onAborted = () => settle(video.currentTime);

      // Settled by destroy() if it comes first
      this._pendingSeeks.add(settle);
      removers.push(
        this._listen(video, 'seeked', onSeeked),
        // Capture, like init: also sees errors at <source> children
        this._listen(video, 'error', onAborted, true),
        this._listen(video, 'emptied', onAborted)
      );

      // After the listeners, in case 'seeked' fires synchronously
      video.currentTime = position;
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
   * Get the media duration.
   *
   * @returns Duration in seconds from the media: 0 until its metadata is
   * loaded, `Infinity` for unbounded media
   */
  override getDuration(): number {
    const duration = this._video?.duration;
    // NaN until metadata is loaded; Infinity for unbounded media is kept
    return duration === undefined || Number.isNaN(duration) ? 0 : duration;
  }

  /**
   * Deactivate the source and reset position.
   *
   * Overrides base to also reset the media's currentTime.
   */
  override deactivate(): void {
    if (this.state === 'inactive') {
      return;
    }
    // Bumps the activation token, pauses once when active, sets inactive
    // and position 0
    super.deactivate();
    if (this._video) {
      this._video.currentTime = 0;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate the configuration, create the video element with its sources
   * and start loading. Resolves on 'canplay', rejects when no source can be
   * played or on a media error.
   */
  private _load(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isDestroyed) {
        reject(
          new Error(
            'VideoPositionSource: cannot init a destroyed position source'
          )
        );
        return;
      }
      // Before the sources check, so old configurations get the real reason
      if (Object.hasOwn(this._config, 'options')) {
        reject(new Error(OPTIONS_REMOVED_MESSAGE));
        return;
      }
      // Inside the executor: an invalid selector makes jQuery throw, which
      // becomes a rejection
      const container = $(this._config.selector).get(0);
      if (!container) {
        reject(
          new Error(
            `VideoPositionSource: container not found for selector '${this._config.selector}'`
          )
        );
        return;
      }
      // Without a source the media element never fires 'canplay' or
      // 'error', so init would never settle
      const {sources} = this._config;
      if (!Array.isArray(sources) || sources.length === 0) {
        reject(
          new Error(
            "VideoPositionSource: 'sources' is required (an array of {src, type})"
          )
        );
        return;
      }
      const loadTimeout = this._config.loadTimeout ?? DEFAULT_LOAD_TIMEOUT_MS;
      if (
        typeof loadTimeout !== 'number' ||
        !Number.isFinite(loadTimeout) ||
        loadTimeout < 0
      ) {
        reject(
          new Error(
            "VideoPositionSource: 'loadTimeout' must be a finite number of milliseconds, 0 or more (0 disables the limit)"
          )
        );
        return;
      }
      const invalid = sources.findIndex(
        source => !isNonEmptyString(source?.src)
      );
      if (invalid !== -1) {
        reject(
          new Error(
            `VideoPositionSource: sources[${invalid}].src must be a non-empty string`
          )
        );
        return;
      }

      const doc = container.ownerDocument;
      const video = this._createVideoElement(doc);
      // The browser skips a type it cannot play without requesting it;
      // leaving those out makes the last <source> the real last candidate
      const playable = sources.filter(
        ({type}) => !isNonEmptyString(type) || video.canPlayType(type) !== ''
      );
      if (playable.length === 0) {
        reject(
          new Error(
            `VideoPositionSource: failed to load video (${this._sourceList()}): none of the sources has a type this browser can play`
          )
        );
        return;
      }

      this._pendingInit = {resolve, reject};
      this._video = video;
      this._sourceElements = playable.map(source =>
        createSourceElement(doc, source)
      );
      // Listeners before any <source> is attached
      this._attachListeners(video);
      if (loadTimeout > 0) {
        this._startLoadTimer(video, loadTimeout);
      }
      for (const element of this._sourceElements) {
        video.appendChild(element);
      }
      // In the DOM before loading starts. appendChild on the first match,
      // not jQuery append, so nothing is cloned into other matches.
      container.appendChild(video);
      video.load();
    });
  }

  private _sourceList(): string {
    return this._config.sources.map(source => source.src).join(', ');
  }

  /**
   * Create the video element (DOM APIs, so `src` and `poster` need no
   * escaping).
   */
  private _createVideoElement(doc: Document): HTMLVideoElement {
    const video = doc.createElement('video');
    video.id = this._videoElementId;
    video.className = VIDEO_ELEMENT_CLASS;
    video.preload = 'auto';
    video.controls = false;
    video.autoplay = false;
    // iOS plays inline instead of switching to fullscreen
    video.playsInline = true;
    // Never set video.loop: the source loops itself so the 'end' and
    // 'start' boundaries fire. video.muted is not set: playback starts
    // unmuted, as in 3.x.
    if (this._config.poster !== undefined) {
      video.poster = this._config.poster;
    }
    return video;
  }

  /**
   * Add an event listener and record its remover in `group`. The only
   * place that calls addEventListener.
   */
  private _listen(
    target: EventTarget,
    type: string,
    handler: (event: Event) => void,
    capture = false,
    group: Set<TRemoveListener> = this._listeners
  ): TRemoveListener {
    target.addEventListener(type, handler, capture);
    const remove = () => {
      // Same capture flag, or the removal is a no-op
      target.removeEventListener(type, handler, capture);
      group.delete(remove);
    };
    group.add(remove);
    return remove;
  }

  /**
   * Attach the media listeners. Each handler first checks that its element
   * is still the current one, so nothing from an old element can drive a
   * new attempt.
   */
  private _attachListeners(video: HTMLVideoElement): void {
    const current = () => this._video === video;
    this._listen(video, 'timeupdate', () => {
      if (current()) {
        this._handleTimeUpdate();
      }
    });
    this._listen(video, 'ended', () => {
      if (current()) {
        this._handleEnded();
      }
    });
    const removePlaying = this._listen(video, 'playing', () => {
      removePlaying();
      if (current()) {
        this._notifyContainerReady();
      }
    });
    this._listen(
      video,
      'canplay',
      () => {
        if (current()) {
          this._settleInit();
        }
      },
      false,
      this._initListeners
    );
    // 'error' does not bubble. A failed <source> fires it at the <source>,
    // not at the video, and leaves video.error null. A capture listener on
    // the video sees both.
    this._listen(
      video,
      'error',
      event => {
        if (current()) {
          this._handleInitError(event, video);
        }
      },
      true,
      this._initListeners
    );
  }

  /**
   * Reject the pending init when no source has become playable within
   * `ms`. The timer is an init listener, so settling or tearing down init
   * clears it.
   */
  private _startLoadTimer(video: HTMLVideoElement, ms: number): void {
    const timer = setTimeout(() => {
      if (this._video === video) {
        this._failInit(
          new Error(
            `VideoPositionSource: failed to load video (${this._sourceList()}): no source became playable within ${ms} ms`
          )
        );
      }
    }, ms);
    const clear = () => {
      clearTimeout(timer);
      this._initListeners.delete(clear);
    };
    this._initListeners.add(clear);
  }

  private _handleInitError(event: Event, video: HTMLVideoElement): void {
    let detail: string;
    if (event.target === video) {
      detail = describeMediaError(video.error);
    } else if (
      event.target === this._sourceElements.at(-1) ||
      // Some browsers fire no error at the remaining non-viable sources;
      // NETWORK_NO_SOURCE means no candidate is left (no sources are added
      // later)
      video.networkState === NETWORK_NO_SOURCE
    ) {
      detail = ': none of the sources could be played';
    } else {
      // An earlier <source> failed and the browser tries the next one
      return;
    }
    this._failInit(
      new Error(
        `VideoPositionSource: failed to load video (${this._sourceList()})${detail}`
      )
    );
  }

  /**
   * Settle the pending init promise once: resolve without an error, reject
   * with one. Removes the init listeners either way.
   */
  private _settleInit(error?: unknown): void {
    const pending = this._pendingInit;
    if (!pending) {
      return;
    }
    this._pendingInit = null;
    for (const remove of [...this._initListeners]) {
      remove();
    }
    if (error === undefined) {
      pending.resolve();
    } else {
      pending.reject(error);
    }
  }

  /**
   * Reject the pending init and remove the element, so no element or
   * listener survives a failed init.
   */
  private _failInit(error: Error): void {
    this._settleInit(error);
    this._teardown();
  }

  /**
   * Settle pending seeks, remove every listener and release the media
   * element.
   */
  private _teardown(): void {
    const video = this._video;
    // Settle pending seeks with the media time, before the listeners go
    const position = video?.currentTime ?? this.getPosition();
    for (const settleSeek of [...this._pendingSeeks]) {
      settleSeek(position);
    }
    // Remove every remaining listener, so nothing below can call back
    for (const remove of [...this._listeners, ...this._initListeners]) {
      remove();
    }
    this._video = null;
    this._sourceElements = [];
    if (!video) {
      return;
    }
    // Release the media. The <source> children must go before load(),
    // otherwise load() selects them again.
    video.pause();
    for (const source of [...video.querySelectorAll('source')]) {
      source.remove();
    }
    video.removeAttribute('src');
    // Aborts the download and frees the decoder
    video.load();
    video.remove();
  }

  /**
   * Handle the media's timeupdate event.
   */
  private _handleTimeUpdate(): void {
    if (this.state !== 'active' || !this._video) {
      return;
    }
    this.setPosition(this._video.currentTime);
  }

  /**
   * Handle the media's ended event.
   */
  private _handleEnded(): void {
    if (this.state !== 'active') {
      return;
    }

    this.emitBoundary('end');

    if (!this.loop) {
      // No-op when a boundary listener already stopped or destroyed it
      this.deactivate();
      return;
    }
    if (this.state !== 'active') {
      // An 'end' listener paused, stopped or destroyed the source
      return;
    }

    if (this._video) {
      this._video.currentTime = 0;
    }
    this.setPosition(0);
    this.emitBoundary('start');
    if (this.state !== 'active') {
      // A 'start' listener paused it
      return;
    }

    // Nobody awaits this replay, so handle its rejection here
    this._video?.play()?.catch(() => {});
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
