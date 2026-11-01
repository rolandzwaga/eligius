# Plan: VideoPositionSource on a native HTMLVideoElement (4.0.0)

Date: 2026-11-01 (revision 2, after `critique-research.md`, `critique-behaviour.md`, `critique-consumers.md`). Branch: `feat/native-video-source` (HEAD `30f2ac79`, only `specs/006-native-video-source/` untracked).
Inputs: `research-codebase.md` (RC), `research-native-video.md` (RN), the three critiques (CR = critique-research, CB = critique-behaviour, CC = critique-consumers), and the source files they cite, re-read for this revision.
Line numbers are those of the working tree at HEAD `30f2ac79`.

Rules for the implementer (from the task): npm only; run npm through PowerShell (CLAUDE.md "Windows Workarounds"): `powershell.exe -Command "cd 'f:\projects\eligius\eligius' ; <command>"`. Never hand-edit generated files (`src/*/metadata/`, `jsonschema/`, `docs/`, `docs.json`). Do not run `npm run docs`; do not commit or push. Tests are written before the code they prove.

---

## 1. Scope and non-goals

### In scope

1. Rewrite `src/timelineproviders/position-sources/video-position-source.ts` so `VideoPositionSource` creates and drives a native `<video>` element. No player library of any kind.
2. Keep the class name `VideoPositionSource`, the exports `VideoSource`, `VideoPositionSourceConfig` (`src/timelineproviders/index.ts:30-34`, re-exported by `src/index.ts:25`), and the configuration shape `{systemName: 'VideoPositionSource', selector, sources: [{src, type}], poster?}`. Existing JSON configurations and Eligian DSL output keep working unchanged (Eligian emits `{systemName: 'VideoPositionSource', selector}` at type level and `{selector, sources}` per timeline, never `options`, CC S5 / CR S9).
3. Remove the `options` key (video.js options passthrough: declared `video-position-source.ts:75-79`, spread into the player at `:396`, read for sources at `:443-446`):
   - `ConfigurationResolver` rejects it with an error naming the JSON path (section 4.1).
   - The JSON schema rejects it wherever `systemName` is `VideoPositionSource` (section 4.2).
   - `VideoPositionSourceConfig` loses the property; `init()` rejects a stray `options` key from callers that bypass the resolver.
4. Remove video.js everywhere it is a dependency or documented as one, including `.specify/memory/constitution.md` (section 5).
5. Version 4.0.0 with a CHANGELOG `Breaking Changes` section and migration steps (section 8).

### Non-goals

- No HLS (`.m3u8`) or DASH (`.mpd`) player, no Media Source Extensions, no `@videojs/html`, no hls.js. Only what the browser plays natively (maintainer confirmed none of their sources need streaming).
- No new configuration keys (no `muted`, `controls`, `className`, `crossOrigin`). The config shape is frozen.
- No change to `BasePositionSource`, the engine, `EngineFactory` construction (`engine-factory.ts:519-535`), the override merge (`timeline-provider-overrides.ts`), or the fluent API (`timeline-provider-settings-editor.ts:17,102,119`, RC section 3).
- No `requestVideoFrameCallback`; position still comes from `timeupdate` (about 4 Hz, as under video.js, RC 1.15).
- No rejection of `options` for other position sources (decision and evidence in section 4.2 and "Critique resolutions" CR S3).
- Historical documents stay: `CHANGELOG.md` 3.0.0 text (`:56`), `specs/00*/**`, `specs/main/**`, `specs/position-source-ideas.md`, `.claude/workflows/**`, and the tracked `docs/` site (regenerated at release, section 9).

---

## 2. Behavioural contract

Guarantees 1-17 are RC section 1; N1-N9 are added by this plan. Test ids (V.., R.., W.., S..) are defined in section 6.

| #   | Guarantee (current code)                                                                                                                                                                                                                                                                                                                                                                             | Native implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Proven by                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Constructor is side-effect free: `super(0)`, stores config, makes id `video-<uuid>` (`video-position-source.ts:145-150`). `EngineFactory` passes an extra `duration` (`engine-factory.ts:529-534`) that the class ignores.                                                                                                                                                                           | Unchanged apart from field names. No DOM, no media call. `duration` ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | V01; `engine-factory-create-timeline-providers.spec.ts` (real instances, `:11`) unchanged and green. |
| 2   | `init()` rejects `VideoPositionSource: container not found for selector '<selector>'` when `$(selector)` is empty, before creating anything (`:158-165`).                                                                                                                                                                                                                                            | Same text, same moment. Container = `$(selector).get(0)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | V21                                                                                                  |
| 3   | `init()` rejects `VideoPositionSource: 'sources' is required (an array of {src, type})` when `sources` is not a non-empty array, before creating anything (`:167-177`). Today sources come from `options.sources ?? sources` (`:443-446`).                                                                                                                                                           | Same text; reads only `config.sources`. A stray `options` key rejects first (N5). Each entry needs a non-empty string `src` (N7).                                                                                                                                                                                                                                                                                                                                                                                                   | V22, V23, V23a, V24                                                                                  |
| 4   | `init()` resolves on the first `canplay`, rejects on `error` with `VideoPositionSource: failed to load video (<src list>)[: <message>]`; first event wins (`:418-432`, `_settleInit` `:452-463`).                                                                                                                                                                                                    | `canplay` resolves. One capture-phase `error` listener on the `<video>` rejects when the target is the video (media error, `video.error`), or when the target is a `<source>` and either it is the last appended `<source>` or `video.networkState === NETWORK_NO_SOURCE` (3) at that moment (no candidate left; CB M1). Sources whose `type` the browser reports it cannot play (`canPlayType(type) === ''`) are not appended, and init rejects at once when none is left (N6). Both init listeners are removed when init settles. | V10-V16, V12a, V12b                                                                                  |
| 5   | Element is in the DOM before loading starts (`:182-183`, `:468-472`); poster only when defined (`:393-395`).                                                                                                                                                                                                                                                                                         | `<video>` with its `<source>` children is appended to the container, then `load()` is called. Poster set only when defined. Native `loop` never set, no `autoplay`, no `controls`.                                                                                                                                                                                                                                                                                                                                                  | V02-V09, V04a-V04c                                                                                   |
| 6   | `destroy()` before init settles rejects init with `VideoPositionSource: destroyed before init completed` (`:208-213`); the video.js continuation bails (`:189-192`).                                                                                                                                                                                                                                 | `doDestroy` rejects the pending init, then tears down listeners and the element. No async load step is left; instead "no listener fires after destroy".                                                                                                                                                                                                                                                                                                                                                                             | V25, V26                                                                                             |
| 7   | `seek()` always settles: destroyed/uninitialised returns `getPosition()` without touching the media (`:266-268`); resolves on `seeked` with the media time after `setPosition` (`:285-292`); settles on `error`/`emptied` with the current time (`:295-297`); settled by destroy (`:215-218`, `:300`); removes its listeners (`:279-281`); listeners before `currentTime` is assigned (`:301-305`).  | Same, with `addEventListener`/`removeEventListener`; the seek's `error` listener is capture-phase like init's. New early returns where the HTML seek algorithm fires no `seeked` (CB S1, CR S6): `video.error` set (fatal error already reported) or `seekable.length === 0` resolve with `video.currentTime`; `readyState === HAVE_NOTHING` stores the value as default start position and resolves with it.                                                                                                                       | V46-V56, V50a, V54a, V54b                                                                            |
| 8   | Container ready on the first `playing`, one-shot; late registrations run immediately (`:330-336`, `:412-416`, `:535-542`). `getContainer()` returns `$(config.selector)`, not the video (`:318-320`; engine uses it, `eligius-engine.ts:410`).                                                                                                                                                       | Same; the `playing` listener removes itself after the first event. `getContainer()` unchanged. `doDestroy` also clears `_containerReadyCallbacks` (latent leak, RC 1.8).                                                                                                                                                                                                                                                                                                                                                            | V62-V66, V70                                                                                         |
| 9   | Duration: `player.duration() ?? 0` (`:347-349`). video.js returns `NaN` until the duration is known (`node_modules/video.js/dist/video.es.js:24113-24116`) and `?? 0` does not catch `NaN`, so 3.x returned 0 only before the player existed and `NaN` until metadata (CB S4).                                                                                                                       | No element or `NaN`: 0. Finite: the value. `Infinity` (unbounded media): `Infinity`, which `BasePositionSource` documents (`base-position-source.ts:73`) and which keeps engine seeks working (`eligius-engine.ts:605`, `:647` compare `position > duration`; 0 would block every seek).                                                                                                                                                                                                                                            | V42-V45                                                                                              |
| 10  | Loop in `ended` (`:509-530`): ignored unless active; emits `end`; with `this.loop` resets to 0, emits `start`, replays with a handled rejection; otherwise `deactivate()`. The engine sets `loop` after init (`eligius-engine.ts:809`, `:944`).                                                                                                                                                      | Same, plus a state check after each boundary in the loop branch, so a boundary listener that pauses, stops or destroys the source is not overridden by the replay (CB S2, N8). The native `loop` property is never set (otherwise `ended` would not fire, RN section 1).                                                                                                                                                                                                                                                            | V57-V61, V60a, V60b, V09                                                                             |
| 11  | `deactivate()` no-op when inactive; stops ticking when active; resets `currentTime` to 0; then `super.deactivate()` (`:356-370`).                                                                                                                                                                                                                                                                    | Order changed (CB S6): `super.deactivate()` first (bumps the activation token, pauses once when active, state inactive, position 0, `base-position-source.ts:194-207`), then `video.currentTime = 0`. Same observable result; `pause()` runs once instead of twice.                                                                                                                                                                                                                                                                 | V30, V31, V36a                                                                                       |
| 12  | `startTicking` awaits `play()` so rejection reaches `activate()` (`:236-241`); `stopTicking` pauses (`:243-246`); base reverts state / ignores superseded starts (`base-position-source.ts:140-180`).                                                                                                                                                                                                | `await this._video?.play()` (works when `play()` returns a Promise and when it returns `undefined`, as unstubbed jsdom does, RN section 2). AbortError from a `pause()` during a pending `play()` reaches only a superseded activation (section 3.4).                                                                                                                                                                                                                                                                               | V27, V34-V37, V36a                                                                                   |
| 13  | No handler leaks: every listener tracked and removed in `doDestroy` (`:220-224`, `:480-490`); seek listeners removed on settle.                                                                                                                                                                                                                                                                      | Every `addEventListener` goes through one helper that records a remover (same `capture` flag). One-shot listeners are removed when they fire or init settles, and in any case on destroy. Every handler also ignores events from an element that is no longer `this._video`.                                                                                                                                                                                                                                                        | V16, V17, V18, V50, V52, V69, V70                                                                    |
| 14  | Destroy disposes the player and removes the element by id (`:226-233`).                                                                                                                                                                                                                                                                                                                              | Teardown by element reference: `pause()`, remove `<source>` children, remove the `src` attribute, `load()` (aborts the fetch, RN section 4), `remove()`.                                                                                                                                                                                                                                                                                                                                                                            | V68                                                                                                  |
| 15  | Position only while active: `timeupdate` ignored unless active (`:495-504`); suspend keeps the position.                                                                                                                                                                                                                                                                                             | Same: `setPosition(video.currentTime)` only when active.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | V29, V38-V41                                                                                         |
| 16  | State machine inherited from `BasePositionSource`, not overridden (except `deactivate`).                                                                                                                                                                                                                                                                                                             | Unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | V27-V32                                                                                              |
| 17  | Pre-init calls are harmless (`this._player?.` everywhere).                                                                                                                                                                                                                                                                                                                                           | `this._video?.` everywhere; `seek` returns `getPosition()`. Between `init()` and its settlement the element exists, so transport calls act on it, as 3.x calls did once the player existed.                                                                                                                                                                                                                                                                                                                                         | V33, V45, V56, V71                                                                                   |

New guarantees (hardening, each cheap and tested):

| #   | Guarantee                                                                                                                                                                                      | Why                                                                                                                                                                                                                                                                                                                                                                                                                       | Proven by  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| N1  | A failed init removes the element and its listeners; a retried `init()` creates exactly one fresh element, and a late event on the old element settles nothing.                                | The engine retries a failed init on next use: `_prepareSource` adds a source to `_preparedSources` only after `init()` succeeds (`eligius-engine.ts:984-993`; doc `:968-972` "A failed init is not remembered, so the next use retries it"). Today every `doInit` appends another element (`:468-472`) and `_eventHandlers` only grows (CR M1).                                                                           | V17, V18   |
| N2  | `init()` is idempotent: a pending or completed init is shared, never a second element.                                                                                                         | Same leak.                                                                                                                                                                                                                                                                                                                                                                                                                | V19, V20   |
| N3  | `init()` after `destroy()` rejects.                                                                                                                                                            | Otherwise it would create an element nobody removes.                                                                                                                                                                                                                                                                                                                                                                      | V26        |
| N4  | A `selector` matching several elements gets one video, in the first match.                                                                                                                     | Today the HTML string is appended to every match (`:469-471`); jQuery `append(node)` would clone a node into all but the last match (CR S1).                                                                                                                                                                                                                                                                              | V08        |
| N5  | `init()` rejects a stray `options` key.                                                                                                                                                        | Callers that bypass the resolver (JS, `new VideoPositionSource(...)`).                                                                                                                                                                                                                                                                                                                                                    | V24        |
| N6  | Sources the browser reports it cannot play (`canPlayType(type) === ''`) are not appended; when none is left `init()` rejects at once and nothing is attached.                                  | The spec uses the same "knows it cannot render" test to skip a `type`, so dropping them changes nothing the browser would play, and it makes the last appended `<source>` the real last candidate. WebKit fires no `error` at sources skipped after an earlier fetch failure (CB M1).                                                                                                                                     | V04c, V12b |
| N7  | `init()` rejects a source entry whose `src` is not a non-empty string, naming `sources[i].src`; `type` is written only when it is a non-empty string (otherwise the browser sniffs the media). | `el.src = undefined` becomes the URL `.../undefined`, and `type="undefined"` is skipped as unplayable (CR S8). video.js derived a missing `type` from the extension (`video.es.js:10005-10012` `fixSource`), so a missing `type` must not break (CB S3).                                                                                                                                                                  | V23a, V04b |
| N8  | In the loop branch of `ended`, the replay runs only while the source is still active after the `end` and `start` boundaries.                                                                   | `emitBoundary('end')` runs the engine's `timelineComplete` synchronously (`eligius-engine.ts:1011-1016`, `:1127-1130`); `EngineEventbusAdapter` broadcasts `timeline-complete` synchronously and maps `timeline-pause-request` to `engine.pause()` (`src/adapters/engine-eventbus-adapter.ts:98-99`, `:146-147`). A pause there would otherwise be followed by an audible replay while `playState` is `'paused'` (CB S2). | V60a, V60b |
| N9  | Elements are created with the container's `ownerDocument`.                                                                                                                                     | `EngineFactory` takes a `window`; iframe hosts (CR S2).                                                                                                                                                                                                                                                                                                                                                                   | V02        |

---

## 3. Design of the new `video-position-source.ts`

### 3.1 Public types (complete)

```ts
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
}
```

No `options` property. No new exports. The video.js loader (`:6-38`), `TVideojs` (`:8`), `import type vjs` (`:4`), `_player`, `_createPlayer`, `_getSources`, `_addPlayerListener`, `_eventHandlers` are deleted.

### 3.2 Module constants and private state

```ts
/** CSS class of the video element the source creates. */
const VIDEO_ELEMENT_CLASS = 'eligius-video';

/** HTMLMediaElement constants, without reading a global of one realm. */
const HAVE_NOTHING = 0;
const NETWORK_NO_SOURCE = 3;

const OPTIONS_REMOVED_MESSAGE =
  "VideoPositionSource: 'options' is no longer supported (the video.js player options were removed in 4.0.0). Put 'sources' and 'poster' directly in the position source settings and delete 'options'.";

type TRemoveListener = () => void;

// fields
private readonly _config: VideoPositionSourceConfig;
private readonly _videoElementId: string;            // unchanged generation, :149
private _video: HTMLVideoElement | null = null;
private _sourceElements: HTMLSourceElement[] = [];   // only the appended (playable) ones
private _initPromise: Promise<void> | null = null;
private _pendingInit: {resolve: () => void; reject: (error: unknown) => void} | null = null;
private readonly _listeners = new Set<TRemoveListener>();      // timeupdate, ended, playing, seek listeners
private readonly _initListeners = new Set<TRemoveListener>();  // canplay, capture error
private readonly _containerReadyCallbacks: Array<() => void> = [];
private _containerReady = false;
private readonly _pendingSeeks = new Set<(position: number) => void>();
```

Listener helper (the only place that calls `addEventListener`):

```ts
private _listen(
  target: EventTarget,
  type: string,
  handler: (event: Event) => void,
  capture = false,
  group: Set<TRemoveListener> = this._listeners
): TRemoveListener {
  target.addEventListener(type, handler, capture);
  const remove = () => {
    target.removeEventListener(type, handler, capture); // same capture flag, or the removal is a no-op
    group.delete(remove);
  };
  group.add(remove);
  return remove;
}
```

Sets are always iterated through copies (`[...set]`) because removers delete themselves.

### 3.3 Init

```ts
protected doInit(): Promise<void> {
  // N2: a pending or completed init is shared; a failed one is forgotten so
  // the engine's retry (eligius-engine.ts:984-993) starts clean (N1)
  this._initPromise ??= this._load().catch((error: unknown) => {
    this._initPromise = null;
    throw error;
  });
  return this._initPromise;
}

private _load(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (this.isDestroyed) {                                   // N3 (base getter, base-position-source.ts:278)
      reject(new Error('VideoPositionSource: cannot init a destroyed position source'));
      return;
    }
    if (Object.hasOwn(this._config, 'options')) {             // N5, before the sources check so
      reject(new Error(OPTIONS_REMOVED_MESSAGE));             // old configs get the real reason
      return;
    }
    const container = $(this._config.selector).get(0);       // N4: first match
    if (!container) {
      reject(new Error(`VideoPositionSource: container not found for selector '${this._config.selector}'`));
      return;
    }
    const {sources} = this._config;
    if (!Array.isArray(sources) || sources.length === 0) {
      reject(new Error("VideoPositionSource: 'sources' is required (an array of {src, type})"));
      return;
    }
    const invalid = sources.findIndex(source => !isNonEmptyString(source?.src));
    if (invalid !== -1) {                                      // N7
      reject(new Error(`VideoPositionSource: sources[${invalid}].src must be a non-empty string`));
      return;
    }

    const doc = container.ownerDocument;                       // N9
    const video = this._createVideoElement(doc);
    const playable = sources.filter(                           // N6
      ({type}) => !isNonEmptyString(type) || video.canPlayType(type) !== ''
    );
    if (playable.length === 0) {
      reject(new Error(`VideoPositionSource: failed to load video (${this._sourceList()}): none of the sources has a type this browser can play`));
      return;                                                  // nothing attached, nothing to tear down
    }

    this._pendingInit = {resolve, reject};
    this._video = video;
    this._sourceElements = playable.map(source => createSourceElement(doc, source));
    this._attachListeners(video);        // before any <source> is attached (RC section 9 "Listener order")
    for (const element of this._sourceElements) {
      video.appendChild(element);
    }
    container.appendChild(video);        // in the DOM before loading starts (guarantee 5)
    video.load();                        // mirrors player.load() (:434)
  });
}

private _sourceList(): string {
  return this._config.sources.map(source => source.src).join(', ');
}
```

`isNonEmptyString(value: unknown): value is string` is a two-line module function (`typeof value === 'string' && value.length > 0`). Keep the `$(...)` call inside the executor: an invalid selector makes jQuery throw, and inside the executor that becomes a rejection, as today (`:157-158`). Plain `appendChild` on the first match, not jQuery `append`, so nothing is cloned (CR S1).

Element creation (DOM APIs, not an HTML string, so `src`/`poster` need no escaping):

```ts
private _createVideoElement(doc: Document): HTMLVideoElement {
  const video = doc.createElement('video');
  video.id = this._videoElementId;
  video.className = VIDEO_ELEMENT_CLASS;
  video.preload = 'auto';        // as before (:390)
  video.controls = false;        // as before (:386); the default, explicit
  video.autoplay = false;        // as before (:389); the default, explicit
  video.playsInline = true;      // new: iOS plays inline instead of fullscreen (CHANGELOG "Changed")
  // Never set video.loop: the source loops itself so 'end'/'start' boundaries fire (guarantee 10)
  // video.muted is not set: video.js did not mute either
  if (this._config.poster !== undefined) {
    video.poster = this._config.poster;
  }
  return video;
}

function createSourceElement(doc: Document, {src, type}: VideoSource): HTMLSourceElement {
  const element = doc.createElement('source');
  element.src = src;
  if (isNonEmptyString(type)) {  // N7: no type="undefined"; without a type the browser sniffs
    element.type = type;
  }
  return element;
}
```

Listeners. Each handler first checks that its element is still the current one, so nothing from an old element can drive a new attempt (N1, belt and braces next to the removal in `_teardown`):

```ts
private _attachListeners(video: HTMLVideoElement): void {
  const current = () => this._video === video;
  this._listen(video, 'timeupdate', () => current() && this._handleTimeUpdate());
  this._listen(video, 'ended', () => current() && this._handleEnded());
  const removePlaying = this._listen(video, 'playing', () => {
    removePlaying();
    if (current()) {
      this._notifyContainerReady();
    }
  });
  this._listen(video, 'canplay', () => current() && this._settleInit(), false, this._initListeners);
  // 'error' does not bubble. A failed <source> fires it at the <source>, not at the video,
  // and leaves video.error null (RN section 1). A capture listener on the video sees both.
  this._listen(video, 'error', event => current() && this._handleInitError(event, video), true, this._initListeners);
}

private _handleInitError(event: Event, video: HTMLVideoElement): void {
  let detail: string;
  if (event.target === video) {
    detail = describeMediaError(video.error);
  } else if (
    event.target === this._sourceElements.at(-1) ||
    video.networkState === NETWORK_NO_SOURCE   // CB M1: WebKit/Blink fire no error at the
  ) {                                           // remaining non-viable sources; no candidate is left
    detail = ': none of the sources could be played';
  } else {
    return; // an earlier <source> failed and the browser is trying the next one (NETWORK_LOADING)
  }
  this._failInit(new Error(`VideoPositionSource: failed to load video (${this._sourceList()})${detail}`));
}

/** jsdom has no `error` property at all (RN section 2), so read it defensively. */
function describeMediaError(error: MediaError | null | undefined): string {
  if (error?.message) {
    return `: ${error.message}`;
  }
  return error?.code !== undefined ? `: MediaError code ${error.code}` : '';
}
```

Why `networkState === NETWORK_NO_SOURCE` is a sound total-failure signal here (resolves CR S7 against CB M1): the resource selection algorithm sets `NETWORK_NO_SOURCE` only in its "waiting" step, that is when no candidate is left, and keeps `NETWORK_LOADING` while it tries the next one (WHATWG media "resource selection algorithm"; WebKit `waitForSourceChange` sets it synchronously in the run that queues the source's `error` task, CB M1). RN's caveat ("also true while waiting for more sources") describes exactly that waiting state, and this source never appends sources later. The last-source rule stays for Gecko, which fires `error` at every skipped source.

Settling:

```ts
private _settleInit(error?: unknown): void {
  const pending = this._pendingInit;
  if (!pending) {
    return;
  }
  this._pendingInit = null;
  for (const remove of [...this._initListeners]) {
    remove();          // canplay and capture error both go, whichever fired (guarantee 13)
  }
  if (error === undefined) {
    pending.resolve();
  } else {
    pending.reject(error);
  }
}

private _failInit(error: Error): void {
  this._settleInit(error);
  this._teardown();    // N1: no element or listener survives a failed init
}
```

`canplay` implies `readyState >= HAVE_FUTURE_DATA`, so metadata (and `duration`) are known when init resolves. Media events are queued tasks, so nothing can fire while `_load` runs and no "already ready" shortcut is needed.

### 3.4 Transport

```ts
protected async startTicking(): Promise<void> {
  // Position comes from 'timeupdate'; only playback needs starting. play() rejects when the
  // browser blocks autoplay (NotAllowedError); activate() then reverts the state and rethrows.
  // Unstubbed jsdom returns undefined; awaiting undefined is fine.
  await this._video?.play();
}

protected stopTicking(): void {
  this._video?.pause();
}

override deactivate(): void {
  if (this.state === 'inactive') {
    return;
  }
  // Bumps the activation token, pauses once when active, sets inactive and position 0
  // (base-position-source.ts:194-207)
  super.deactivate();
  if (this._video) {
    this._video.currentTime = 0;
  }
}
```

`play()`/`pause()` promise handling, all cases (corrected per CB S6):
- `activate()` → `play()` rejects with `NotAllowedError`: `startTicking` rejects, base `activate()` reverts the state and rethrows (`base-position-source.ts:160-169`). Unchanged.
- `suspend()`, `deactivate()` or `destroy()` while `play()` is pending: the base class bumps the activation token before it calls `stopTicking()` (suspend `:188-190`, deactivate `:200-202`, destroy `:112-114`), and with the new `deactivate()` override no `pause()` runs before `super.deactivate()`. The pending `play()` is rejected with `AbortError` asynchronously (a media element task, RN section 1), and the `await started` continuation in `activate()` (`:161-165`) sees a newer token and resolves silently. The ordering is guaranteed by the code, not only by the asynchronous delivery.
- Loop replay in `ended`: nobody awaits it; `this._video?.play()?.catch(() => {})` (as `:525`). The `?.` before `catch` is required because jsdom's unstubbed `play()` returns `undefined`.
- `_teardown` calls `pause()` and `load()`, which reject a pending play with `AbortError`; that play belongs to a superseded activation (destroy bumped the token) or to an activation that started during a pending init that then failed, which then rejects (correct: there is nothing to play).

### 3.5 Seek

```ts
async seek(position: number): Promise<number> {
  const video = this._video;
  if (!video || this.isDestroyed) {
    return this.getPosition();                        // guarantee 7, first bullet; 17
  }
  if (video.error) {
    // A fatal media error was already reported; no 'seeked', 'error' or 'emptied' will follow (CB S1)
    return video.currentTime;
  }
  if (video.readyState === HAVE_NOTHING) {
    // No metadata: the element keeps the value as its default playback start position, the
    // getter returns it, and the real seek runs when metadata arrives (RN section 1, CR S6)
    video.currentTime = position;
    this.setPosition(position);
    return position;
  }
  if (video.seekable.length === 0) {
    // HTML seek algorithm: "If there are no ranges given in the seekable attribute, then set
    // the seeking IDL attribute to false and return" — no 'seeked' (CB S1)
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

    this._pendingSeeks.add(settle);                   // settled by destroy() if it comes first
    removers.push(
      this._listen(video, 'seeked', onSeeked),
      this._listen(video, 'error', onAborted, true),  // capture, like init: also <source> errors (CR S6)
      this._listen(video, 'emptied', onAborted)
    );
    video.currentTime = position;                     // after the listeners (guarantee 7)
  });
}
```

Return values, stated once (CR S6): not initialised or destroyed → `getPosition()` (current contract); media error or nothing seekable → `video.currentTime` (where the media is); no metadata → the requested position (what the getter will report and where playback starts). The engine ignores the value (`_seekSource`, `eligius-engine.ts:1545-1556`), so only direct callers see the difference. No clamping (as today, RC section 9 "Seeking"); the engine clamps against `getDuration()` (`eligius-engine.ts:813-818`). After a successful init `readyState >= HAVE_FUTURE_DATA`, so the `HAVE_NOTHING` branch only matters for a seek during a pending init or after a browser-side reset.

### 3.6 Position, ended, duration, container

```ts
private _handleTimeUpdate(): void {
  if (this.state !== 'active' || !this._video) {
    return;
  }
  this.setPosition(this._video.currentTime);
}

private _handleEnded(): void {                         // port of :509-530, plus N8
  if (this.state !== 'active') {
    return;
  }
  this.emitBoundary('end');
  if (!this.loop) {                                    // read at event time
    this.deactivate();                                 // no-op if a listener already stopped or destroyed it
    return;
  }
  if (this.state !== 'active') {
    return;                                            // an 'end' listener paused, stopped or destroyed the source
  }
  if (this._video) {
    this._video.currentTime = 0;
  }
  this.setPosition(0);
  this.emitBoundary('start');
  if (this.state !== 'active') {
    return;                                            // a 'start' listener paused it
  }
  // Nobody awaits this replay, so handle its rejection here
  this._video?.play()?.catch(() => {});
}

override getDuration(): number {
  const duration = this._video?.duration;
  // NaN until metadata is loaded; Infinity for unbounded media is kept
  return duration === undefined || Number.isNaN(duration) ? 0 : duration;
}

getContainer(): JQuery<HTMLElement> | undefined {     // unchanged, :318-320
  return $(this._config.selector);
}

onContainerReady(callback: () => void): void { ... }  // unchanged, :330-336
private _notifyContainerReady(): void { ... }        // unchanged, :535-542
```

The non-loop branch keeps the 3.x unconditional `deactivate()` (`:528`): the media has ended, so inactive is its terminal state, and `deactivate()` is a no-op when a listener already made it inactive. The guard is applied where it prevents the CB S2 replay. `getContainer` and `onContainerReady` must stay prototype methods: `EngineFactory` detects intrinsic containers by them (`engine-factory.ts:824-844`).

### 3.7 Destroy (cleanup order)

`BasePositionSource.destroy()` bumps the token, calls `stopTicking()` when active, sets state inactive and position 0, clears its callbacks, then calls `doDestroy()` (`base-position-source.ts:111-123`).

```ts
protected doDestroy(): void {
  // 1. reject a pending init (guarantee 6); also removes the init listeners
  this._settleInit(new Error('VideoPositionSource: destroyed before init completed'));
  // 2. a later init() must reach _load() and be refused (N3)
  this._initPromise = null;
  // 3-5. settle seeks, remove listeners, release the media
  this._teardown();
  // 6. drop the consumers' container-ready callbacks (RC 1.8 latent leak)
  this._containerReadyCallbacks.length = 0;
}

private _teardown(): void {
  const video = this._video;
  // 3. settle pending seeks with the media time (guarantee 7), before the listeners go
  const position = video?.currentTime ?? this.getPosition();
  for (const settleSeek of [...this._pendingSeeks]) {
    settleSeek(position);
  }
  // 4. remove every remaining listener (guarantee 13), so nothing below can call back
  for (const remove of [...this._listeners, ...this._initListeners]) {
    remove();
  }
  this._video = null;
  this._sourceElements = [];
  if (!video) {
    return;
  }
  // 5. release the media (guarantee 14); <source> removal must precede load(), otherwise
  // load() selects them again (RN section 4)
  video.pause();
  for (const source of [...video.querySelectorAll('source')]) {
    source.remove();
  }
  video.removeAttribute('src');
  video.load();      // aborts the download and frees the decoder; fires 'emptied'/'abort', unheard
  video.remove();
}
```

`_containerReady` is not reset: a destroyed source is terminal. Residual risk, unchanged from 3.x and out of scope: a source whose media never answers (no `canplay`, no `error`) keeps `init()` pending, and the engine destroys a still-initialising source only when its init settles (`eligius-engine.ts:1216-1223`, `:1105-1125`).

### 3.8 JSDoc

Replace the class JSDoc (`:82-115`) with: "Position source driven by a native HTML `<video>` element." Describe: the element it creates (`<video id="video-…" class="eligius-video" preload="auto" playsinline>` plus one `<source>` per playable entry, appended to the first element matching `selector`); no controls and no styling (size it with CSS on `.eligius-video`; host code can reach the element as `container.querySelector('video.eligius-video')`); browser-playable media only (video or audio), no HLS/DASH player; `init()` resolves on `canplay` and rejects when no source can be played, on a media error, for a missing container or sources, an entry without `src`, or a removed `options` key; `getContainer()` is the selector's element; autoplay policies may reject activation with `NotAllowedError`. Keep the existing `@example` (`:93-114`). Constructor doc (`:140-144`): "Create a new video position source." `selector` doc (`:60`), `sources` doc (`:64-68`) per 3.1. `getDuration` doc (`:342-346`): "Duration in seconds from the media: 0 until its metadata is loaded, `Infinity` for unbounded media." `seek` doc (`:252-264`): add the three early returns of 3.5.

---

## 4. Configuration

### 4.1 Resolver (`src/configuration/configuration-resolver.ts`)

Current state: provider-specific settings are checked only for timelines with a `positionSource` override (`:250-257`); `timelineProviderSettings.<type>.positionSource` is never inspected for provider keys (RC 0.3). `hasRequiredSetting` accepts `options.sources` (`:385-397`, comment `:390`). `assertTimelineProviderSettings` runs on the raw `configuration` (`:136`), so the deep copies (`:110`) do not affect it.

Changes:
1. New helper next to `REQUIRED_PROVIDER_SETTINGS` (`:290-294`):

```ts
/**
 * VideoPositionSource took video.js player options under `options` until
 * 4.0.0 removed video.js. Other position sources may still take an
 * `options` key, so only the effective system name `VideoPositionSource` is
 * checked.
 *
 * @param positionSource - The settings object as written in the configuration
 * @param systemName - The effective system name (inherited for overrides without one)
 * @param path - JSON path of `positionSource`
 */
function assertNoVideoOptions(
  positionSource: Record<string, unknown>,
  systemName: unknown,
  path: string
) {
  if (
    systemName !== 'VideoPositionSource' ||
    !Object.hasOwn(positionSource, 'options')
  ) {
    return;
  }
  throw new Error(
    `Invalid configuration at ${path}.options: VideoPositionSource no longer accepts 'options' (the video.js player options were removed in 4.0.0). Put 'sources' and 'poster' directly in ${path} and delete 'options'. See the 4.0.0 migration steps in CHANGELOG.md.`
  );
}
```

The message names the path and the fix, and contains no configuration data (style of `describeValue`, `:179`).
2. In `assertTimelineProviderSettings` (`:218-267`):
   - At the top, after `const settings = ...` (`:222`) and before the timeline loop, check every own type key, including types no timeline uses (fail fast):

     ```ts
     for (const [type, typeSettings] of Object.entries(settings)) {
       if (isObject(typeSettings) && isObject(typeSettings.positionSource)) {
         assertNoVideoOptions(
           typeSettings.positionSource,
           typeSettings.positionSource.systemName,
           `timelineProviderSettings.${type}.positionSource`
         );
       }
     }
     ```
   - In the per-timeline loop, right after the two `assertProviderOverride` calls (`:231-242`; they guarantee an object override) and before the missing-settings check (`:244`) and `assertMergedProviderSettings` (`:250-257`), so the `options` error wins over "Missing setting ... sources" for an old override whose sources sit inside `options` (CR S4):

     ```ts
     if (isObject(timeline.positionSource)) {
       assertNoVideoOptions(
         timeline.positionSource,
         effectivePositionSource(timeline, typeSettings)?.systemName,
         `${path}.positionSource`
       );
     }
     ```

     `effectivePositionSource` (`timeline-provider-overrides.ts:55-63`) gives the inherited system name for an override without `systemName`, and the override's own name when it replaces the type (`mergeProviderConfig`, `:41-46`), so a `RafPositionSource` override with `options` over a video type is accepted.

3. `hasRequiredSetting` (`:385-397`): replace the `sources` branch and its comment (`:389-394`) with

   ```ts
   if (key === 'sources') {
     return isNonEmptyArray(settings.sources);
   }
   ```

   (`isNonEmptyArray`, `:399-401`, stays.)

4. Class JSDoc (`:38-63`): add
   `@throws When a VideoPositionSource has an 'options' key, at timelineProviderSettings.<type>.positionSource or at a timeline's positionSource override (also when the override inherits VideoPositionSource from its type). 4.0.0 removed the video.js player options.`

### 4.2 JSON schema

Choice: a schema rule that applies only when `systemName` is `VideoPositionSource`, added to `IPositionSourceConfig` and `Partial<IPositionSourceConfig>` after generation (RC section 4 option 3). The resolver and the schema have the same scope (VideoPositionSource only). The one case the schema cannot express is a per-timeline override without `systemName` that inherits `VideoPositionSource` from its type (JSON Schema cannot look at the type's settings); the resolver rejects it, and the CHANGELOG says so (CC S3).

Why not `options?: never` on `IPositionSourceConfig` (CR S3 recommends it; CR verified it renders as `{"not": {}}`): it would forbid `options` on every position source, including custom ones, which is a wider break than the maintainer's decision ("the video.js options passthrough"), and a compile-time break for TypeScript authors of custom sources. The `if/then` gap is the inheriting override only; Eligian emits such overrides (`{selector, sources}`) but never with `options` (CR S3 / CC S5), so DSL output is unaffected.

New module `src/tools/schema-tools/video-options-rule.ts` (side-effect free, so a spec can import it; `generate-schemas.ts` cannot be imported by a test because it runs `generateConfigurationSchema()` at module level, `:62`):

```ts
/**
 * VideoPositionSource lost its `options` key in 4.0.0. IPositionSourceConfig keeps an index
 * signature for custom position sources, so the rule cannot come from the TypeScript type.
 * It is added to the type settings definition and to the per-timeline override definition.
 * A per-timeline override without a systemName that inherits VideoPositionSource cannot be
 * recognised by the schema; ConfigurationResolver rejects it.
 */
export const VIDEO_OPTIONS_REMOVED = {
  if: {
    properties: {systemName: {const: 'VideoPositionSource'}},
    required: ['systemName'],
  },
  then: {
    properties: {
      options: {
        not: {},
        description:
          "Removed in 4.0.0. Put 'sources' and 'poster' directly in the position source settings.",
      },
    },
  },
};

export const POSITION_SOURCE_DEFINITIONS = [
  'IPositionSourceConfig',
  'Partial<IPositionSourceConfig>',
] as const;

export function forbidVideoOptions(definitions: Record<string, any>): void {
  for (const name of POSITION_SOURCE_DEFINITIONS) {
    const definition = definitions[name];
    if (!definition) {
      throw new Error(
        `Definition '${name}' not found; update forbidVideoOptions in video-options-rule.ts`
      );
    }
    if ('if' in definition || 'then' in definition) {
      throw new Error(
        `Definition '${name}' already has if/then; merge forbidVideoOptions by hand`
      );
    }
    Object.assign(definition, structuredClone(VIDEO_OPTIONS_REMOVED));
  }
}
```

The description deliberately does not say "video.js", so the T7 check cannot match it (CC M2).

`src/tools/schema-tools/generate-schemas.ts`: `import {forbidVideoOptions} from './video-options-rule.ts';` (same directory, relative import allowed by CLAUDE.md), and inside `postProcessConfigSchema` (`:458-491`), in the `if (processed.definitions)` block (`:476-488`), after the operation loop: `forbidVideoOptions(processed.definitions);`. Both definition keys exist in the current output (`jsonschema/eligius-configuration.json:149` and `:718`; type settings `$ref` at `:130`, override `$ref` URL-encoded at `:632`). The schema is draft-07 (`generate-schemas.ts:100`), which supports `if/then/const`; `then` is evaluated independently of the definition's `additionalProperties` (`:194-196`). A throw inside `generateConfigurationSchema`'s `try` exits with code 1 (`:112-115`), so a renamed definition fails the build instead of silently dropping the rule.

### 4.3 `src/configuration/types.ts` docs (feed the schema descriptions)

- `:149` ` * - \`VideoPositionSource\`: Video.js-based, drives timeline by video playback`→` * - \`VideoPositionSource\`: native HTML video element, drives timeline by media playback`.
- `:200-203` `sources` doc → "Media to load (video sources), each with its URL and MIME type, in order of preference. `VideoPositionSource` requires a non-empty list of browser-playable media files (video or audio, for example MP4, WebM or MP3)."
- `:211-214` index signature doc → append: "`VideoPositionSource` rejects an `options` key (removed in 4.0.0)."
- `:417-421` "...only an override that changes the video settings creates a second player." → "...creates a second video element."
- Do NOT add `options?: never`. Keep the index signature (section 4.2).

`src/engine-factory.ts:675-676` (doc comment): "does not create a second player; a timeline whose override changes the video settings gets a player of its own" → "video element" in both places. Wording only.

---

## 5. Dependency removal

| File                                                                                                            | Location                                                                                                                                                                                                                                                                                                                          | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                                                                                  | devDependencies `:89` `"video.js": "8.24.2",`; peerDependencies `:96`; peerDependenciesMeta `:105-107`                                                                                                                                                                                                                            | Run `npm uninstall video.js`. npm removes the name from `devDependencies`, `peerDependencies` and `peerDependenciesMeta` (CR, arborist `add-rm-pkg-deps.js`) and prunes the lock. Then check `git diff package.json`: all three entries gone, the preceding `lottie-web` entries lost their trailing commas. If anything remains, delete it by hand and run `npm install`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `package-lock.json`                                                                                             | `packages[""]` mirrors `:39`, `:49`, `:58-60`; `node_modules/video.js` and its dev-only transitive packages (`@videojs/http-streaming`, `@videojs/vhs-utils`, `@videojs/xhr`, `aes-decrypter`, `global`, `m3u8-parser`, `mpd-parser`, `mux.js`, `videojs-contrib-quality-levels`, `videojs-font`, `videojs-vtt.js`, RC section 5) | Never hand-edit; pruned by `npm uninstall`. Verify: `npm ls video.js` prints `(empty)`; `Select-String -Path package-lock.json -Pattern 'video\.js                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | videojs | @videojs'` finds nothing. |
| `package.json` / lock                                                                                           | version `:4` `3.1.0`; lock `:3`, `:9`                                                                                                                                                                                                                                                                                             | `npm version 4.0.0 --no-git-tag-version` (no commit, no tag; `package.json` has no `version` lifecycle scripts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `tsdown.config.ts`                                                                                              | `:30` `external: ['lottie-web', 'jquery', 'video.js'],`                                                                                                                                                                                                                                                                           | `external: ['lottie-web', 'jquery'],`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `tsdown.config.ts`                                                                                              | `:47` `// standalone bundle is free of jquery / lottie-web / video.js and imports cleanly`                                                                                                                                                                                                                                        | `// standalone bundle is free of jquery / lottie-web and imports cleanly`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/tools/type-tools/check-dist-types.ts`                                                                      | no video reference (RC section 5, confirmed by CR); scenarios `:153-176`                                                                                                                                                                                                                                                          | No removal. Add a smoke check to `mainConsumer` (`:98-126`), below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `.github/dependabot.yml`                                                                                        | `:42-43` `- dependency-name: video.js` / `update-types: [version-update:semver-major]`                                                                                                                                                                                                                                            | delete both lines; comment `:36-39` stays valid (jquery, lottie-web)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/metadata.ts`                                                                                               | `:8` ` * import jquery / lottie-web / video.js.`                                                                                                                                                                                                                                                                                  | ` * import jquery / lottie-web.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/configuration-api.ts`                                                                                      | `:10-11` `... so it stays free of jquery,` / ` * lottie-web and video.js.`                                                                                                                                                                                                                                                        | `... so it stays free of jquery` / ` * and lottie-web.` (re-wrap to 80 columns)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/test/unit/configuration-api.spec.ts`                                                                       | `:14-16` `vi.mock('video.js', ...)`                                                                                                                                                                                                                                                                                               | delete; comment `:6-7` stays accurate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/test/unit/configuration/api/node-environment.spec.ts`                                                      | `:11-13` comment, `:20-22` mock                                                                                                                                                                                                                                                                                                   | delete the mock; comment → "The fluent API must not load the peer dependencies. jquery@4 already throws without a DOM, but lottie-web does not, and src/test/setup.ts mocks lottie-web for every spec. These factories make any import of the two fail."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/test/setup.ts`                                                                                             | mocks only `lottie-web`                                                                                                                                                                                                                                                                                                           | no change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `typedoc.json`, `typedoc-metadata.json`, `biome.json`, `tsconfig.json`, `.gitignore`, `.github/workflows/*.yml` | no video reference (RC section 5)                                                                                                                                                                                                                                                                                                 | no change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `README.md`                                                                                                     | `:78`, `:276`, `:497`, `:521`, `:524`                                                                                                                                                                                                                                                                                             | section 8.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE.md`                                                                                                     | `:3`, `:29`, `:31`, `:56`, `:199`, `:211`, `:242`, `:443`                                                                                                                                                                                                                                                                         | section 8.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `specs/TESTING-GUIDE.md`                                                                                        | `:303`, `:315`, `:325`, `:344`, `:394-405`, `:428`, `:599`                                                                                                                                                                                                                                                                        | section 6.7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `.specify/memory/constitution.md`                                                                               | `:69`, `:298`, `:347`, `:544`, `:550`, `:628`                                                                                                                                                                                                                                                                                     | Unconditional (CC M1). The constitution makes video.js a mandated peer that "MUST NOT be substituted without a constitutional amendment" (`:56`, `:66-69`); the maintainer's "remove video.js completely" is that decision, and the amendment process asks for a documented version bump (`:710-716`). Edits: delete `:69` and `:628`; remove `video.js` from the lists at `:298` ("lottie-web documentation ..."), `:347`, `:544`, `:550`; bump `**Version**: 1.3.0` (`:15`) and the footer (`:760`) to `1.4.0`, footer `Last Amended: 2026-11-01`; replace the Sync Impact Report (`:1-11`) with `Version: 1.3.0 → 1.4.0 (MINOR: video.js removed from the mandated peer dependencies; VideoPositionSource uses the native HTMLVideoElement)`, `Modified Principles: II. Technology Stack`, `Templates Requiring Updates: ✅ CLAUDE.md (Technology Stack)`. |

`check-dist-types.ts` smoke addition (proves the published main entry type-checks with `VideoPositionSource` and without video.js, and that `options` is gone from the public type). In `mainConsumer` (`:98-126`):

```ts
import {
  EligiusResourceImporter,
  EngineFactory,
  LottieController,
  VideoPositionSource,
} from 'eligius';
import type {IAddClassOperationData, ILottieControllerMetadata, VideoPositionSourceConfig} from 'eligius';
...
const videoConfig: VideoPositionSourceConfig = {selector: '#video', sources: [{src: '/a.mp4', type: 'video/mp4'}], poster: '/p.jpg'};
const video = new VideoPositionSource(videoConfig);
// @ts-expect-error 'options' was removed in 4.0.0
const withOptions: VideoPositionSourceConfig = {selector: '#video', sources: [], options: {}};
```

and add `video, withOptions` to the `export {...}` line (`:125`). Keep each literal on one line so `@ts-expect-error` covers the excess-property error. No scenario installs video.js, so a leaked `import('video.js')` type would fail every scenario.

Final checks for leftovers (CC M1: grep for dependency usage, not for the word; the word legitimately stays in migration messages, the CHANGELOG and history):
1. Must find nothing:
   `git grep -n -E "from 'video\.js'|import\('video\.js'\)|\"video\.js\":|vi\.mock\('video\.js'|@videojs|videojs\(|class=\"video-js\"" -- . ":!docs" ":!CHANGELOG.md" ":!specs/00*" ":!specs/main" ":!specs/position-source-ideas.md" ":!specs/006-native-video-source" ":!.claude"`
2. Review list (not required to be empty): `git grep -n -i -E "video\.js|videojs" -- . ":!docs" ":!specs/00*" ":!specs/main" ":!specs/position-source-ideas.md" ":!specs/006-native-video-source" ":!.claude"`. Expected hits only: `CHANGELOG.md` (3.0.0 history and the 4.0.0 entry), the `OPTIONS_REMOVED_MESSAGE` and resolver message/JSDoc ("the video.js player options were removed"), their spec expectations, and the README upgrade line. Anything else is a leftover.

---

## 6. Test plan

### 6.1 Environment facts the tests rely on (jsdom 30.1.3, RN section 2, RC section 2)

- `load()`, `play()`, `pause()` call `notImplementedMethod` (`node_modules/jsdom/lib/jsdom/living/nodes/HTMLMediaElement-impl.js:99-112`), which emits a `jsdomError` "Not implemented: HTMLMediaElement's play() method" and returns `undefined`. `canPlayType()` returns `''` (`:102-104`). `readyState`, `networkState`, `currentTime` are plain values 0; `duration` is `NaN`; `seekable`/`buffered`/`played` are dummies with `length: 0` (`:7-17`, `:22-35`); there is no `error` property.
- Vitest's jsdom environment passes no `virtualConsole` unless `console: true` (`node_modules/vitest/dist/chunks/index.CK-t0WMg.js:1293-1300`); jsdom then creates `new VirtualConsole().forwardTo(console)` (`node_modules/jsdom/lib/api.js:210-212`), which forwards every `jsdomError` to `console.error` (`node_modules/jsdom/lib/jsdom/virtual-console.js:24-33`). Unstubbed media calls therefore print noise.
- Avoiding the noise: every describe block installs prototype stubs for `play`, `pause`, `load` and `canPlayType` in `beforeEach` (fixture 6.2); the source never calls `addTextTrack`. `restoreMocks: true` and `clearMocks: true` (`src/vitest.config.ts`) restore them after each test; `pool: 'vmThreads'` gives each spec file its own realm, so prototype spies cannot leak into other files. No global stub in `src/test/setup.ts` (it would hide jsdom gaps from other specs, RC section 2). T3's "done when" includes "no `Not implemented` line in the output".
- Read-only members are defined per instance with `Object.defineProperty(video, name, {configurable: true, value})` (probe-confirmed, RN section 2). The prototype getters (`HTMLMediaElement.js:384-386` for `seekable`) are shadowed by the own property.
- No media event fires by itself. Tests dispatch `new Event(type)` (non-bubbling, like browsers) on the `<video>` or a `<source>`. A capture listener on the video sees an event dispatched on a `<source>` child.
- The new source uses no timers, so the spec needs no fake timers (`vi.advanceTimersByTimeAsync(10)` after `init()`, repeated about 35 times today, goes away).

### 6.2 New fixture: `src/test/fixtures/video-element-factory.ts` (written first, task T1)

Per TESTING-GUIDE.md helpers live in `src/test/fixtures/` (today `action-factory.ts`, `eventbus-factory.ts`, `jquery-factory.ts`). This file is linted (only spec files are excluded).

```ts
import {type MockInstance, vi} from 'vitest';

export interface IMediaElementStubs {
  play: MockInstance<HTMLMediaElement['play']>;
  pause: MockInstance<HTMLMediaElement['pause']>;
  load: MockInstance<HTMLMediaElement['load']>;
  canPlayType: MockInstance<HTMLMediaElement['canPlayType']>;
}

/**
 * Stubs HTMLMediaElement.prototype: play resolves, pause and load do nothing,
 * canPlayType returns 'maybe'. Call in beforeEach.
 */
export function installMediaElementStubs(): IMediaElementStubs;

/** The single <video> inside root (default document); throws when there is none or more than one. */
export function getVideoElement(root?: ParentNode): HTMLVideoElement;

export function getSourceElements(video: HTMLVideoElement): HTMLSourceElement[];

/** Object.defineProperty with configurable: true, for read-only media members. */
export function setMediaProperty(
  media: HTMLMediaElement,
  name:
    | 'duration'
    | 'readyState'
    | 'networkState'
    | 'error'
    | 'currentTime'
    | 'seekable',
  value: unknown
): void;

/** A TimeRanges-like object with the given [start, end] ranges. */
export function timeRanges(...ranges: Array<[number, number]>): TimeRanges;

/** Dispatches a plain, non-bubbling Event. */
export function emitMediaEvent(target: EventTarget, type: string): void;

/**
 * Defines readyState (default 4, HAVE_ENOUGH_DATA), networkState 1 (NETWORK_IDLE),
 * duration (default 60) and seekable [0, duration], then dispatches canplay.
 */
export function makeReady(
  video: HTMLVideoElement,
  options?: {duration?: number; readyState?: number}
): void;

/**
 * Spies (call-through) on EventTarget.prototype.addEventListener/removeEventListener and
 * reports, per target, the listeners added and not removed (type, listener, capture
 * normalised from boolean or {capture}). Install before init().
 */
export function trackEventListeners(): {
  activeOn(target: EventTarget): Array<{type: string; capture: boolean}>;
};
```

`trackEventListeners` uses `spy.mock.contexts[i]` (the `this` of each call) and `spy.mock.calls[i]`.

### 6.3 `src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts` (rewritten FIRST, task T2)

Delete the whole `vi.hoisted` / `vi.mock('video.js')` setup (`:16-135`) and the typed context (`:140-147`). Common setup for every describe:

```ts
let media: IMediaElementStubs;
beforeEach(() => {
  media = installMediaElementStubs();
  document.body.innerHTML = '<div id="video-container"></div>';
});
afterEach(() => {
  document.body.innerHTML = '';
});
const config = (overrides: Partial<VideoPositionSourceConfig> = {}) => ({
  selector: '#video-container',
  sources: [{src: 'video.mp4', type: 'video/mp4'}],
  ...overrides,
});
async function initSource(
  source: VideoPositionSource,
  options?: {duration?: number}
) {
  const pending = source.init();
  const video = getVideoElement();
  makeReady(video, options);
  await pending;
  return video;
}
```

`TWO = [{src: 'video.mp4', type: 'video/mp4'}, {src: 'video.webm', type: 'video/webm'}]`. "Stubs" lists what a test adds to the common setup.

**describe 'VideoPositionSource construction'**
- V01 `given a new source, when it is constructed, then it is inactive at position 0, creates no video element and calls no media method`. Asserts `document.querySelector('video')` is null, no stub called. (Replaces 'lazy video.js loading', spec `:797-857`.)

**describe 'VideoPositionSource element creation'**
- V02 `given a container, when init() is called, then one video element whose id starts with 'video-' and whose class is 'eligius-video' is appended to the container and belongs to the container's document` (`video.ownerDocument === container.ownerDocument`).
- V03 `given init() was called, when the video element is inspected, then preload is 'auto', playsInline is true and controls, autoplay, loop and muted are false`.
- V04 `given two sources, when init() is called, then the video has one source child per entry in order with their src and type attributes` (`getAttribute('src')`, `getAttribute('type')`).
- V04a `given an audio/mpeg source, when init() is called, then its source child has type audio/mpeg and init() resolves on canplay` (Eligian audio timelines, CC S5).
- V04b `given a source without a type, when init() is called, then its source child has no type attribute and canPlayType is not asked about it`.
- V04c `given two sources of which the browser cannot play the first type, when init() is called, then only the second gets a source child`. Stubs: `media.canPlayType.mockImplementation(type => type === 'video/mp4' ? '' : 'maybe')`.
- V05 `given a poster, when init() is called, then the video has that poster attribute` (port of `:1048`).
- V06 `given no poster, when init() is called, then the video has no poster attribute` (port of `:1060`).
- V07 `given init() was called, when load() runs, then the video is already in the document and has its source children`. Stubs: `media.load.mockImplementation(function (this: HTMLMediaElement) { seen.push([this.isConnected, this.children.length]); })`; expects `[[true, 1]]`.
- V08 `given a selector that matches two elements, when init() is called, then only the first match gets a video element`. Body: two `.player` divs; selector `.player`.
- V09 `given loop set to true before init, when init() creates the element, then the native loop property is false`.

**describe 'VideoPositionSource init settlement'**
- V10 `given a pending init, when canplay fires, then init() resolves and the source is still inactive` (port of `:198`).
- V11 `given a pending init without canplay, when pending work has run, then init() has not settled` (settled flag, `await Promise.resolve()` twice).
- V12 `given two sources, when the last source fires error, then init() rejects with the source list and 'none of the sources could be played'`. Exact: `VideoPositionSource: failed to load video (video.mp4, video.webm): none of the sources could be played`. Dispatch on `getSourceElements(video)[1]`.
- V12a `given two sources, when the first source fires error while networkState is NETWORK_NO_SOURCE, then init() rejects with 'none of the sources could be played'` (CB M1). Stubs: `setMediaProperty(video, 'networkState', 3)` before dispatching on source 0.
- V12b `given two sources whose types the browser cannot play, when init() is called, then it rejects at once naming the sources and no video element is in the document`. Config sources `TWO`. Stubs: `media.canPlayType.mockReturnValue('')`. Exact: `VideoPositionSource: failed to load video (video.mp4, video.webm): none of the sources has a type this browser can play`; `media.load` not called.
- V13 `given two sources, when only the first source fires error while networkState is NETWORK_LOADING, then init() stays pending and resolves on canplay`. Stubs: `setMediaProperty(video, 'networkState', 2)` before the error.
- V14 `given a pending init, when the video fires error with a MediaError message, then init() rejects with the source list and that message`. Stubs: `setMediaProperty(video, 'error', {code: 4, message: 'MEDIA_ELEMENT_ERROR: Format error'})`. Exact: `VideoPositionSource: failed to load video (video.mp4): MEDIA_ELEMENT_ERROR: Format error` (port of `:737`).
- V15 `given a pending init, when the video fires error with a MediaError without a message, then the rejection names MediaError code 4`.
- V16 `given init() resolved on canplay, when the video fires error afterwards, then no init listener remains and the source still activates`. Stubs: `trackEventListeners()` before init; no `canplay` and no capture `error` in `activeOn(video)`.
- V17 `given a failed init, when the rejection is observed, then the video element is removed and no listener of the source remains on it`. Stubs: tracker; `media.load` and `media.pause` called by the teardown.
- V18 `given a failed init, when init() is called again, then exactly one fresh video element is in the container, a canplay on the old element does not settle the new init, and the new init resolves on its own canplay` (engine retry, `eligius-engine.ts:984-993`; CR M1).
- V19 `given an initialised source, when init() is called again, then it resolves and no second video element exists`.
- V20 `given a pending init, when init() is called a second time, then one video element exists and both calls resolve on canplay`.
- V21 `given a selector that matches nothing, when init() is called, then it rejects naming the selector and creates no element`. Exact: `VideoPositionSource: container not found for selector '#missing'` (port of `:751`).
- V22 `given no sources, when init() is called, then it rejects naming 'sources' and creates no element` (exact message, port of `:1013`; cast as today `:1017`).
- V23 `given an empty sources array, when init() is called, then it rejects naming 'sources'` (port of `:1026`).
- V23a `given a source entry without src, when init() is called, then it rejects naming sources[1].src and creates no element`. Config sources `[{src: 'a.mp4', type: 'video/mp4'}, {type: 'video/webm'}]` cast. Exact: `VideoPositionSource: sources[1].src must be a non-empty string`.
- V24 `given a config with an options key, when init() is called, then it rejects naming 'options' and creates no element`. Config `{selector, options: {sources: [...]}}` cast like `:1039`; expects `/'options' is no longer supported/` (replaces `:1035`, which accepted it).
- V25 `given a pending init, when destroy() is called, then init() rejects as destroyed, the element is removed and a later canplay on it changes nothing` (port of `:779`; `/destroyed before init completed/`).
- V26 `given a destroyed source, when init() is called, then it rejects as destroyed and creates no element`.

**describe 'VideoPositionSource state transitions'** (ports of `:268-401`)
- V27 `given an initialised source, when activate() is awaited, then the state is active and play() was called once`.
- V28 `given an active source, when suspend() is called, then the state is suspended and pause() was called`.
- V29 `given an active source at 15 seconds, when suspend() is called, then getPosition() is still 15` (currentTime 15 + `timeupdate` before suspend).
- V30 `given an active source, when deactivate() is called, then it is inactive, pause() was called once and currentTime and getPosition() are 0`.
- V31 `given an initialised inactive source, when deactivate() is called, then pause() is not called`.
- V32 `given a suspended source, when activate() is awaited, then play() is called again`.
- V33 `given an uninitialised source, when activate(), suspend() and deactivate() are called, then nothing throws and no media method runs`.

**describe 'VideoPositionSource playback promises'** (ports of `:859-913`, `:1118`)
- V34 `given play() rejects with NotAllowedError, when activate() is awaited, then it rejects with that error, the state is inactive and onActivated is not called`. Stubs: `media.play.mockRejectedValueOnce(notAllowed)`.
- V35 `given play() resolves, when activate() is awaited, then onActivated is called once`.
- V36 `given play, suspend, play while the first play() is pending, when the first rejects with AbortError and the second resolves, then the source is active and onActivated fires once`. Stubs: `media.play.mockImplementation(() => new Promise(...))` collecting deferreds.
- V36a `given play, deactivate, play while the first play() is pending, when the first rejects with AbortError and the second resolves, then the source is active and onActivated fires once` (CB S6).
- V37 `given play() returns undefined as unstubbed jsdom does, when activate() is awaited, then the source is active`. Stubs: `media.play.mockReturnValue(undefined as unknown as Promise<void>)`.

**describe 'VideoPositionSource position updates'** (ports of `:403-498`)
- V38 `given an active source, when timeupdate fires at 5.5 seconds, then the position callback receives 5.5 and getPosition() is 5.5`.
- V39 `given two position callbacks, when timeupdate fires, then both receive the position`.
- V40 `given a suspended source, when timeupdate fires, then no callback runs and the position is unchanged`.
- V41 `given an initialised inactive source, when timeupdate fires, then the position stays 0`.

**describe 'VideoPositionSource duration'**
- V42 `given media metadata with a duration of 120, when getDuration() is called, then it returns 120` (port of `:232`).
- V43 `given no metadata yet, when getDuration() is called, then it returns 0 instead of NaN`.
- V44 `given unbounded media, when getDuration() is called, then it returns Infinity`.
- V45 `given an uninitialised source, when getDuration() is called, then it returns 0`.

**describe 'VideoPositionSource seeking'** (ports of `:500-563`, `:932-946`, `:1071-1116`, `:1148-1184`)
- V46 `given a source, when checked with isSeekable, then it is seekable` (`isSeekable` from `@timelineproviders/types.ts`).
- V47 `given a ready video, when seek(30) is called and seeked fires, then it resolves with 30 and getPosition() is 30`.
- V48 `given an active source with a position callback, when a seek completes, then the callback receives the new position`.
- V49 `given a video that fires seeked synchronously when currentTime is assigned, when seek(10) is awaited, then it resolves with 10`. Stubs: `Object.defineProperty(video, 'currentTime', {configurable: true, get, set(v) {t = v; video.dispatchEvent(new Event('seeked'));}})`. Proves listeners precede the assignment.
- V50 `given a pending seek, when the video fires error instead of seeked, then the seek resolves with the media's current time and no seek listener remains`. Stubs: currentTime getter returning 12, no-op setter; tracker.
- V50a `given a pending seek, when a source child fires error, then the seek settles` (capture listener, CR S6).
- V51 `given a pending seek, when the media is reset with emptied, then the seek resolves with a number`.
- V52 `given a seek that completed with seeked, when the listeners are counted, then no seeked, error or emptied listener of the seek remains`. Stubs: tracker; only `timeupdate`, `ended`, `playing` (not yet fired) remain on the video.
- V53 `given a pending seek, when destroy() is called, then the seek settles with a number`.
- V54 `given a video without metadata, when seek(5) is called, then it resolves with 5 at once, sets currentTime to 5 and adds no listener`. Stubs: `setMediaProperty(video, 'readyState', 0)` after init; tracker.
- V54a `given a video with a MediaError, when seek(5) is called, then it resolves at once with the current time and adds no listener` (CB S1). Stubs: `setMediaProperty(video, 'error', {code: 2, message: ''})`, currentTime 7.
- V54b `given a ready video with nothing seekable, when seek(5) is called, then it resolves at once with the current time and adds no listener` (CB S1). Stubs: `setMediaProperty(video, 'seekable', timeRanges())`.
- V55 `given an initialised source that was destroyed, when seek(30) is awaited, then it resolves with 0 and the removed element's currentTime is unchanged` (port of `:1164`).
- V56 `given an uninitialised source, when seek(30) is awaited, then it resolves with 0`.

**describe 'VideoPositionSource end of media'** (ports of `:565-634`, `:897`)
- V57 `given an active source, when ended fires, then the end boundary is emitted`.
- V58 `given loop false, when ended fires, then the source is inactive and currentTime is 0`.
- V59 `given loop true set after init, when ended fires, then end and start boundaries are emitted in order, currentTime and position are 0, play() is called again and the source stays active`.
- V60 `given loop true and a rejected replay, when ended fires, then the rejection is handled`. Stubs: `const replay = Promise.reject(...)`, `vi.spyOn(replay, 'catch')`, `media.play.mockReturnValueOnce(replay)` (as `:904-911`).
- V60a `given loop true and an end callback that suspends the source, when ended fires, then no start boundary is emitted and play() is not called again` (CB S2).
- V60b `given loop true and a start callback that suspends the source, when ended fires, then play() is not called again`.
- V61 `given a suspended source, when ended fires, then no boundary is emitted`.

**describe 'VideoPositionSource container provider'** (ports of `:636-700`, `:915-930`, `:965-986`)
- V62 `given a source, when its methods are inspected, then it provides getContainer and onContainerReady`.
- V63 `given an initialised source, when getContainer() is called, then it returns the selector's element and not the video`.
- V64 `given a registered ready callback, when the first playing fires, then it runs once and a second playing does not run it again`.
- V65 `given two registered ready callbacks, when playing fires, then both run`.
- V66 `given the container is already ready, when onContainerReady is called, then the callback runs immediately` (port of `:916`).

**describe 'VideoPositionSource destroy'** (ports of `:702-734`)
- V67 `given an initialised source, when destroy() is called, then the state is inactive`.
- V68 `given an initialised source, when destroy() is called, then it pauses, removes the source children and the src attribute before load(), and removes the video from the document`. Stubs: `media.load.mockImplementation` recording `children.length` and `hasAttribute('src')`; the last call saw `[0, false]`.
- V69 `given an active source with a pending seek and a registered ready callback, when destroy() is called, then no listener of the source remains on the video or its sources` (tracker before init).
- V70 `given a destroyed source, when timeupdate, ended and playing are dispatched on the removed element, then no position, boundary or container-ready callback runs`.
- V71 `given an uninitialised source, when destroy() is called, then nothing throws and no media method runs`.

All names follow Given-When-Then. Every test that creates an element runs with the `pause`/`load` stubs, because `destroy()` and failed inits call them.

### 6.4 Resolver tests: `src/test/unit/configuration/configuration-resolver.spec.ts`

In `describe('ConfigurationResolver per-timeline provider overrides')` (`:1313`), with its `timeline()`, `createConfig()` and `process()` helpers (`:1314-1344`). `PATH_MSG(p)` = the exact message of 4.1 with `${path}` = `p`.
- R01 Flip `:1461-1473`: `given a VideoPositionSource override with sources only in options, when process is called, then it throws the options message naming timelines[0].positionSource.options instead of a missing sources setting` (exact `PATH_MSG('timelines[0].positionSource')`; proves CR S4 order).
- R02 `given mediaplayer type settings whose VideoPositionSource has options, when process is called, then it throws naming timelineProviderSettings.mediaplayer.positionSource.options`.
- R03 `given a VideoPositionSource type that no timeline uses has options, when process is called, then it still throws naming its path`.
- R04 `given an override without systemName that adds options over a VideoPositionSource type, when process is called, then it throws naming the override path`.
- R05 `given an override naming RafPositionSource with options over a VideoPositionSource type, when process is called, then it is accepted`.
- R06 `given a RafPositionSource type setting with an options key, when process is called, then it is accepted`.
- R07 `given a VideoPositionSource override with sources and poster at the top level, when process is called, then it is accepted`.
- R08 `given the error for a removed options key, when its message is read, then it contains no configuration values` (options holds `{token: 'tok-123'}`; message must not contain `tok-123`).

Unchanged: `:1426-1443` (poster-only override) and `:1445-1459` (empty sources).

### 6.5 Schema rule tests (unconditional): `src/test/unit/tools/schema-tools/video-options-rule.spec.ts` (new)

Imports `forbidVideoOptions` from `@/tools/schema-tools/video-options-rule.ts` and ajv the way `generate-schemas.spec.ts:243-246` does (`await import('ajv')`, `default ?? module`). Builds an in-memory draft-07 schema: root `{type: 'object', properties: {type: {$ref: '#/definitions/IPositionSourceConfig'}, override: {$ref: '#/definitions/Partial%3CIPositionSourceConfig%3E'}}, definitions: {...}}`, with both definitions shaped like the generated ones (`properties.systemName`, `required: ['systemName']` on the first only, `additionalProperties: {description: '...'}`). Runs on a clean checkout, so the guarantee does not depend on a generated file (CR S5).
- W01 `given both position source definitions, when forbidVideoOptions runs, then a VideoPositionSource with options fails validation at /type/options`.
- W02 `given the rule, when a VideoPositionSource has selector, sources and poster, then it validates`.
- W03 `given the rule, when a RafPositionSource has options, then it validates`.
- W04 `given the rule, when an override names VideoPositionSource and has options, then it fails at /override/options`.
- W05 `given the rule, when an override without systemName has options, then it validates (the resolver rejects it, R04)`.
- W06 `given definitions without IPositionSourceConfig, when forbidVideoOptions runs, then it throws naming the definition`.
- W07 `given a definition that already has if, when forbidVideoOptions runs, then it throws`.

### 6.6 Generated schema tests: `src/test/unit/tools/schema-tools/generate-schemas.spec.ts`

These run against the generated `jsonschema/` and skip themselves when it is missing (`:16`, `:30`, `:248`). T0 and T12 regenerate it, and T12 asserts the file exists before `test:ci`; CI runs `npm run build` (which regenerates it) before `test:ci` (`.github/workflows/ci-build.yml:41`, `:56`).

In `describe('generated JSON schema')`:
- S01 `given the configuration schema, when reading IPositionSourceConfig and Partial<IPositionSourceConfig>, then both forbid options when systemName is VideoPositionSource` (`if.properties.systemName.const` and `then.properties.options.not` on both).

In `describe('generated JSON schema validation with ajv')`, with a helper that builds the configuration of `:306-344` and overrides `timelineProviderSettings`/`timelines`:
- S02 `given a VideoPositionSource with options in timelineProviderSettings, when validated against eligius-configuration.json, then it fails at the options property` (an error whose `instancePath` ends with `/positionSource/options`).
- S03 `given a VideoPositionSource with selector, sources and poster, when validated, then it passes`.
- S04 `given a RafPositionSource with an options key, when validated, then it passes`.
- S05 `given a timeline positionSource override naming VideoPositionSource with options, when validated, then it fails`. Timeline: `{id: 't1', uri: 't1', type: 'mediaplayer', duration: 10, loop: false, selector: '#s', timelineActions: [], positionSource: {systemName: 'VideoPositionSource', options: {}}}` (required keys from the generated `ITimelineConfiguration.required`).

### 6.7 Existing tests and docs that change

- `video-position-source.spec.ts`: rewritten (6.3). Dropped with no equivalent: 'given videojs() throws' (`:764`), both 'lazy video.js loading' tests (`:817`, `:840`), 'sources via options accepted' (`:1035`), and the `player.on`/`player.off` call assertions (`:215`, `:703`, `:1086`, `:1114`), which become behavioural or listener-tracker assertions.
- `configuration-resolver.spec.ts`: R01 flips `:1461`.
- `configuration-api.spec.ts` `:14-16` and `node-environment.spec.ts` `:20-22`: mocks deleted (section 5).
- `engine-factory-create-timeline-providers.spec.ts`, `engine-factory-position-source.spec.ts`, `timeline-provider-overrides.spec.ts`, `timeline-provider-settings-editor.spec.ts`: no change; re-run.
- `specs/TESTING-GUIDE.md`:
  - `:303` "Mock with default export" example: replace `'video.js'` with `'hotkeys-js'`.
  - `:313-436` "Advanced: vi.hoisted() Pattern" (`:315`, `:325`, `:344`, `:394-405`): keep the pattern, swap the example library to hotkeys-js (real use: `src/test/unit/timelineproviders/position-sources/keyboard-step-source.spec.ts:13-77`); `:428` "(video.js, lottie-web)" → "(hotkeys-js, lottie-web)".
  - Add a subsection "Native media elements (HTMLMediaElement) in jsdom" with the facts of 6.1 and the fixture of 6.2, pointing to the new spec.
  - `:599` points at a non-existent `video-js-timeline-provider.spec.ts`; point it at `keyboard-step-source.spec.ts` (vi.hoisted + fake timers) and `video-position-source.spec.ts` (native media events).

---

## 7. Ordered task list

Every npm command: `powershell.exe -Command "cd 'f:\projects\eligius\eligius' ; <command>"`. Focused run: `npm test -- --run <spec path>`.

| Task | What                                                                                                                                                                                                                                                                                                                | Files                                                                                                                                               | Done when                                                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T0   | Confirm branch `feat/native-video-source`; `npm run generate-schema` so the schema specs are not skipped.                                                                                                                                                                                                           | none                                                                                                                                                | branch confirmed, `jsonschema/eligius-configuration.json` present                                                                                                                                                                                                            |
| T1   | Write the fixture (6.2).                                                                                                                                                                                                                                                                                            | `src/test/fixtures/video-element-factory.ts`                                                                                                        | `npm run typecheck` passes                                                                                                                                                                                                                                                   |
| T2   | RED: rewrite the spec (6.3) against the planned API.                                                                                                                                                                                                                                                                | `src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts`                                                                    | `npm test -- --run src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts --testTimeout=1000 --bail=5` fails (the old implementation loads the real video.js 8 under jsdom and waits for `canplay`; the short timeout keeps the red run fast, CC S8) |
| T3   | GREEN: rewrite the source (section 3) and its JSDoc (3.8).                                                                                                                                                                                                                                                          | `src/timelineproviders/position-sources/video-position-source.ts`                                                                                   | focused run passes; `engine-factory-create-timeline-providers.spec.ts` passes; no "Not implemented" line in the output                                                                                                                                                       |
| T4   | RED: resolver tests R01-R08.                                                                                                                                                                                                                                                                                        | `src/test/unit/configuration/configuration-resolver.spec.ts`                                                                                        | R01-R04, R08 fail; R05-R07 pass                                                                                                                                                                                                                                              |
| T5   | GREEN: resolver change (4.1).                                                                                                                                                                                                                                                                                       | `src/configuration/configuration-resolver.ts`                                                                                                       | resolver spec passes                                                                                                                                                                                                                                                         |
| T6   | RED: rule tests W01-W07 (6.5) and generated-schema tests S01-S05 (6.6).                                                                                                                                                                                                                                             | `src/test/unit/tools/schema-tools/video-options-rule.spec.ts`, `src/test/unit/tools/schema-tools/generate-schemas.spec.ts`                          | W spec fails (module missing); S01, S02, S05 fail                                                                                                                                                                                                                            |
| T7   | GREEN: `video-options-rule.ts` (4.2), its call in `generate-schemas.ts`, `types.ts` docs (4.3), `engine-factory.ts:675-676` wording; `npm run generate-schema`.                                                                                                                                                     | `src/tools/schema-tools/video-options-rule.ts`, `src/tools/schema-tools/generate-schemas.ts`, `src/configuration/types.ts`, `src/engine-factory.ts` | both schema specs pass; `Select-String -Path jsonschema/eligius-configuration.json -Pattern 'Video\.js-based' -CaseSensitive` finds nothing (CC M2)                                                                                                                          |
| T8   | Dependencies: `npm uninstall video.js`; check `git diff package.json`, `npm ls video.js`, the lock grep; `tsdown.config.ts:30,47`; `.github/dependabot.yml:42-43`; comments `src/metadata.ts:8`, `src/configuration-api.ts:10-11`; delete the video.js mocks and fix the comment in the two Node-environment specs. | section 5 table                                                                                                                                     | both Node-environment specs pass; `npm ls video.js` prints `(empty)`                                                                                                                                                                                                         |
| T9   | Published types smoke check in `mainConsumer` (section 5).                                                                                                                                                                                                                                                          | `src/tools/type-tools/check-dist-types.ts`                                                                                                          | verified in T12 by `npm run check:types`                                                                                                                                                                                                                                     |
| T10  | `npm version 4.0.0 --no-git-tag-version`.                                                                                                                                                                                                                                                                           | `package.json`, `package-lock.json`                                                                                                                 | both say 4.0.0                                                                                                                                                                                                                                                               |
| T11  | Docs: CHANGELOG (8.2), README (8.3), CLAUDE.md (8.4), TESTING-GUIDE (6.7), constitution (section 5).                                                                                                                                                                                                                | `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `specs/TESTING-GUIDE.md`, `.specify/memory/constitution.md`                                               | grep 1 of section 5 finds nothing; grep 2 shows only the expected hits                                                                                                                                                                                                       |
| T12  | Checks, in this order (below).                                                                                                                                                                                                                                                                                      |                                                                                                                                                     | all succeed                                                                                                                                                                                                                                                                  |

T12 commands (each through PowerShell as above):

```
npm install
npm ls video.js
npm run metadata
npm run generate-schema
Test-Path jsonschema/eligius-configuration.json
npm run fix
npm run lint
npm run typecheck
npm run test:ci
npm run build
npm run check:types
git grep -n -E "from 'video\.js'|import\('video\.js'\)|\"video\.js\":|vi\.mock\('video\.js'|@videojs|videojs\(|class=\"video-js\"" -- . ":!docs" ":!CHANGELOG.md" ":!specs/00*" ":!specs/main" ":!specs/position-source-ideas.md" ":!specs/006-native-video-source" ":!.claude"
git grep -n -i -E "video\.js|videojs" -- . ":!docs" ":!specs/00*" ":!specs/main" ":!specs/position-source-ideas.md" ":!specs/006-native-video-source" ":!.claude"
```

`Test-Path` must print `True`. `npm ls video.js` must print `(empty)`. The first `git grep` must print nothing (exit code 1 is the pass); the second is reviewed against section 5. `npm install` (not `npm ci`) locally: `npm ci` deletes `node_modules` first and fails with EPERM on Windows while tools such as typegraph-mcp or TSGo run from it (CC S9); CI runs `npm ci` on the pruned lock (`.github/workflows/ci-build.yml:38`). `npm run fix` and `npm run lint` write files; review `git diff` after them. Do not run `npm run docs`; do not commit.

---

## 8. Breaking changes, CHANGELOG, package.json, README, CLAUDE.md

### 8.1 Why this is major

Removing `VideoPositionSourceConfig.options` from an exported type and rejecting configurations that were valid in 3.x are breaking (CLAUDE.md "Public API stability"). Dropping a peer dependency and the DOM produced by the source (no `div.video-js` wrapper, no `vjs-*` nodes) break consumer CSS and setup. No deprecation cycle is possible: the 3.x integration cannot move to video.js 10, whose `video.js` package no longer contains the player.

### 8.2 CHANGELOG.md: insert above `## 3.1.0` (`:3`)

````markdown
## 4.0.0

`VideoPositionSource` plays media with the browser's own `<video>` element, and Eligius no longer depends on video.js in any form. video.js 10 removed the player API that 3.x used, so the integration could not be upgraded. Read the breaking changes and the migration steps before upgrading from 3.x.

### Breaking Changes

- **`VideoPositionSource` drives a native `<video>` element instead of a video.js player.**
  - Was: `init()` loaded the optional `video.js` 8 peer dependency with a dynamic `import()` and created a video.js player. The `<video>` moved into a wrapper `div.video-js` (the video itself became `.vjs-tech`), with video.js UI components such as the poster image, loading spinner and big play button (hidden while controls are off), and default dimensions from video.js's injected `vjs-styles-defaults` style.
  - Now: `init()` appends `<video id="video-…" class="eligius-video" preload="auto" playsinline>` with one `<source src type>` per entry of `sources` to the first element matching `selector`. There are no controls, no wrapper elements and no styles; size the element with CSS.
- **`options` is removed from `VideoPositionSource`.** It passed video.js player options through.
  - Was: `{"systemName": "VideoPositionSource", "selector": "#video", "options": {"sources": [...], "poster": "..."}}` was accepted, and `options.sources` counted as the required sources.
  - Now: `ConfigurationResolver` throws `Invalid configuration at <path>.options: VideoPositionSource no longer accepts 'options' ...` for an `options` key on a `VideoPositionSource` in `timelineProviderSettings.<type>.positionSource` or in a timeline's `positionSource` override, including an override without `systemName` that inherits `VideoPositionSource` from its type. The JSON schema rejects it wherever `systemName` is `VideoPositionSource`. `VideoPositionSourceConfig` no longer has the property, and `init()` rejects when the source is constructed directly with `options`. Other position sources may still take an `options` key.
- **No streaming player.** HLS (`.m3u8`) and DASH (`.mpd`) used to play through video.js's streaming engine. VideoPositionSource no longer ships one: HLS and DASH play only where the browser supports them natively, which is not portable. Stay on 3.x if you need them.

#### Migrating from 3.x

1. Remove video.js unless your application uses it elsewhere: `npm uninstall video.js`, and remove imports or `<link>` tags of `video.js/dist/video-js.css`. Bundles or loaders that import `video.js` only for Eligius can drop that import.
2. Move `sources` and `poster` out of `options` into the position source settings and delete `options`, in `timelineProviderSettings` and in timeline `positionSource` overrides.

   3.x:

   ```json
   {"systemName": "VideoPositionSource", "selector": "#video", "options": {"sources": [{"src": "/intro.mp4", "type": "video/mp4"}], "poster": "/intro.jpg"}}
   ```

   4.0.0:

   ```json
   {"systemName": "VideoPositionSource", "selector": "#video", "sources": [{"src": "/intro.mp4", "type": "video/mp4"}], "poster": "/intro.jpg"}
   ```

   The other video.js options have no replacement in the configuration; delete them. That includes `controls`, `muted`, `loop`, `playsinline`, `fluid`, `aspectRatio`, `techOrder`, `crossOrigin` and plugin options.
3. Replace CSS that targets `.video-js`, `.vjs-tech` or `.vjs-*` with rules for `.eligius-video`, for example `#video .eligius-video {width: 100%; height: auto;}`. Eligius gives the element no size.
4. Replace code that used the video.js player API (`videojs.getPlayer(...)`, `videojs.players`, player plugins, `player.*` calls) with the `HTMLVideoElement`: after the timeline's `init()`, `document.querySelector('#video video.eligius-video')`. There is no configuration for controls; host code can set `video.controls = true` on that element.
5. Make sure every `type` is a real MIME type the browser recognises (`video/mp4`, `video/webm`, `audio/mpeg`, ...), and list sources in order of preference. A source whose `type` the browser reports it cannot play is left out without being fetched; the browser plays the first remaining source it supports and falls back to the next when one fails. Replace `.m3u8` and `.mpd` sources with progressive files, or stay on 3.x.
6. Playback still starts unmuted, as with video.js, so a browser autoplay policy can still reject it with `NotAllowedError`; start playback from a user gesture as before.

Configurations (and Eligian programs) that already use `selector`, `sources` and `poster` need no change. Audio sources (`audio/mpeg`, `audio/ogg`, ...) still play through `VideoPositionSource`; the `<video>` element shows no picture for them, and no poster unless one is set.

### Removed

- `video.js` from `peerDependencies`, `peerDependenciesMeta`, `devDependencies` and the build externals.
- `VideoPositionSourceConfig.options`, and the `init()` error "VideoPositionSource requires the optional peer dependency 'video.js'".

### Changed

- **Source fallback.** In 3.x the first `error` of the player rejected `init()`, even when a later source might have played. In 4.0.0 the browser falls back to the next `<source>`, and `init()` rejects with `VideoPositionSource: failed to load video (<sources>): none of the sources could be played` only when no source is left, with the browser's message (or `MediaError code <n>`) on a media error, and at once with `... none of the sources has a type this browser can play` when no `type` is playable.
- **Source entries are checked.** `init()` rejects an entry without a non-empty `src`, naming `sources[<i>].src`. An entry without `type` is passed to the browser without a `type` attribute, so the browser detects the format (video.js guessed the type from the file extension).
- **`playsinline`.** The video element has `playsinline`, so iOS Safari plays inline instead of switching to fullscreen.
- **Native looping is never used.** In 3.x a `loop` set on the source before `init()` turned on video.js's own looping, which emitted no `end`/`start` boundaries. In 4.0.0 the source always loops itself and emits both. The engine sets `loop` after `init()`, so engine users see no difference. A boundary listener that pauses or stops the source during the loop now prevents the replay.
- **Init retries.** A failed `init()` removes the element, so the engine's retry starts with one fresh element. A second `init()` returns the first one's result instead of appending a second element, and `init()` after `destroy()` rejects.
- `VideoPositionSource.getDuration()` returns 0 instead of `NaN` until the media metadata is loaded, then the media duration (`Infinity` for unbounded media).
- `VideoPositionSource.seek()` settles at once with the media's current time when the media has a fatal error or nothing is seekable, instead of waiting for a `seeked` event that never comes. A seek while `init()` is still loading the media resolves at once with the requested position, and playback starts there (video.js deferred it and resolved on a later `seeked`).
- `VideoPositionSource.destroy()` releases the media (pauses, removes the sources, aborts the download, removes the element) and drops registered container-ready callbacks.
- A `VideoPositionSource` `selector` that matches several elements gets one video element, in the first match (3.x appended a `<video>` to every match and played the first).
````

### 8.3 package.json and README.md

- `package.json:4` → `"version": "4.0.0"` via `npm version 4.0.0 --no-git-tag-version` (T10). Dependency edits in section 5.
- `README.md:78` → ``- `VideoPositionSource` - native HTML `<video>` element, for video and audio timelines (browser-playable media files such as MP4, WebM or MP3; no HLS/DASH player)``
- After the position source list (`:75-79`), add:

  ````markdown
  A media timeline names the container, the sources (in order of preference) and an optional poster:

  ```json
  "mediaplayer": {
    "positionSource": {
      "systemName": "VideoPositionSource",
      "selector": "#video",
      "sources": [
        {"src": "/intro.webm", "type": "video/webm"},
        {"src": "/intro.mp4", "type": "video/mp4"}
      ],
      "poster": "/intro.jpg"
    }
  }
  ```

  The source appends a `<video class="eligius-video">` without controls to the container; size it with CSS. Since 4.0.0 there is no `options` key.
  ````
- `README.md:276` "Video timelines share one player ... which gives that timeline its own player." → "Video timelines share one video element ... which gives that timeline its own video element." (CR S10, CC S6)
- `README.md:497` "(jQuery, lottie-web, video.js)" → "(jQuery, lottie-web)".
- `README.md:521` delete the `video.js` peer line.
- `README.md:524` → `Upgrading from 3.x? Version 4.0.0 replaces the video.js player with the native video element and removes the \`options\` key of \`VideoPositionSource\`; read the [changelog](CHANGELOG.md) first. Upgrading from 2.x? Read the 3.0.0 breaking changes too.`

### 8.4 CLAUDE.md

- `:3` → `Last re-aligned with the codebase: 2026-11-01`
- `:29` delete (`- video.js (VideoPositionSource), optional, ...`).
- `:31` → `Never import lottie-web statically outside type imports; that would make it required again.`
- `:56` fixtures comment → `# action-factory, eventbus-factory, jquery-factory, video-element-factory`
- `:199` "must stay free of jquery, lottie-web, and video.js imports" → "must stay free of jquery and lottie-web imports".
- `:211` fixture list → add `video-element-factory`, and a bullet: "Media elements: jsdom does not implement `play`/`pause`/`load` and never fires media events; use `src/test/fixtures/video-element-factory.ts` (prototype stubs, event helpers, listener tracker)."
- `:242` ``  - `VideoPositionSource` (video.js)`` → ``  - `VideoPositionSource` (native `<video>` element with `<source>` children; browser-playable media only, no HLS/DASH player; no `options` key since 4.0.0)``
- `:443` drop "video.js, " from the Context7 library list.

---

## 9. Release hand-off (for the orchestrator and the maintainer, not the implementer)

1. **Manual browser check, release blocker** (CB M1 step 4; RN open questions 1-2): in Chrome, Firefox and Safari, a page with `sources: [{src: '/missing.mp4', type: 'video/mp4'}, {src: '/clip.ogv', type: 'video/ogg'}]` (404 first, unsupported second) must reject `init()` with "none of the sources could be played" or "... has a type this browser can play"; `[404 mp4, valid webm]` must resolve. jsdom cannot prove browser event order.
2. **Regenerate and commit `docs/` before publishing 4.0.0.** `docs/` is tracked (641 files) and still documents the video.js player; `docs/jsonschema/eligius-configuration.json` is the schema served at the `$id` URL (`generate-schemas.ts:101-102`), so editors validating through `$schema` keep accepting `options` until it is regenerated (CC M1). Run `npm run docs` and commit (forbidden inside this task).
3. **Eligian follow-ups** (other repository, out of scope): `packages/cli/src/bundler/runtime-bundler.ts:184-188` emits `import videojs from 'video.js'` for video bundles and must drop it once Eligian depends on Eligius 4; `package.json:33` and `packages/cli/package.json:39` pin `eligius` `3.0.1`; the compiled JSON (`config-builder.ts`) needs no change.

---

## Critique resolutions

### critique-research.md

- **M1 duplicate init / engine retry**: accepted. Moved into the contract as N1/N2 (section 2), `doInit` shares or forgets the init promise (3.3), failed inits tear down (3.3 `_failInit`), handlers ignore old elements (3.3 `_attachListeners`). Tests V17, V18 (including the late `canplay` on the old element), V19, V20.
- **S1 jQuery append clones**: accepted. `$(selector).get(0)` + `appendChild` (3.3); N4; V08.
- **S2 ownerDocument**: accepted. N9; V02.
- **S3 schema/resolver scope**: scope kept at VideoPositionSource only for both, so they agree; the `options?: never` option is rejected with reasons in 4.2 (wider break than the decision; compile break for custom sources). The inheriting-override gap is stated in 4.2, the CHANGELOG and W05.
- **S4 rejection order**: accepted. The options check runs before the missing-settings checks (4.1 step 2); R01 now uses sources only in `options` and expects the options message.
- **S5 schema test skipped**: accepted. The rule lives in a side-effect-free module with an unconditional spec (4.2, 6.5 W01-W07); T12 asserts the generated file exists; CI regenerates it in `build` before `test:ci`.
- **S6 seek before metadata**: accepted in part. One return value per case is stated in 3.5; the seek `error` listener is now capture-phase (V50a). The `HAVE_NOTHING` branch keeps resolving with the requested position rather than `getPosition()`, because the element stores it as the default playback start position and its getter returns it (RN section 1), so `getPosition()` (0) would contradict the media.
- **S7 drop the networkState OR**: rejected in favour of CB M1, with evidence: `NETWORK_NO_SOURCE` is set only in the algorithm's waiting step, which here means "no candidate left" because no sources are added later (3.3). Tests V12a (3 rejects) and V13 (2 keeps waiting).
- **S8 entries not validated**: accepted. N7; V23a, V04b.
- **S9 CHANGELOG gaps**: accepted. HLS sentence reworded as "no streaming player ... natively, not portable"; audio documented and tested (V04a); full list of video.js options without replacement in migration step 2; `.vjs-*` CSS in step 3; Eligian bundler follow-up in section 9 and migration step 1.
- **S10 README :276**: accepted (8.3).

### critique-behaviour.md

- **M1 total failure missed in WebKit/Blink**: accepted. Reject on `networkState === NETWORK_NO_SOURCE` at a `<source>` error (3.3); sources with an unplayable `type` are not appended and an all-unplayable list rejects at once (N6). Tests V12a, V12b, V13 (now with `NETWORK_LOADING`), V04c. Manual browser check promoted to a release blocker (section 9). CHANGELOG "Changed" describes the 3.x vs 4.0 fallback difference.
- **S1 seek hangs after a fatal error / no seekable ranges**: accepted. Early returns in 3.5; V54a, V54b; fixture `makeReady` defines `seekable`.
- **S2 loop replay after a pause in the end listener**: accepted for the loop branch (N8, 3.6); V60a, V60b. The non-loop branch keeps the unconditional `deactivate()` with the reason given in 3.6.
- **S3 source without `type`**: accepted. `type` written only when non-empty (N7); V04b; CHANGELOG line.
- **S4 imprecise seek and duration lines**: accepted. Guarantee 9 now says 3.x returned `NaN` (cited `video.es.js:24113-24116`); CHANGELOG says "0 instead of NaN" and words the seek change by case.
- **S5 HLS sentence**: accepted (CHANGELOG "No streaming player").
- **S6 activation-token reasoning**: accepted. `deactivate()` now calls `super.deactivate()` first (2 #11, 3.4), so the token is bumped before the only `pause()`; 3.4 corrected; V36a added; V30 asserts one `pause()`.
- **S7 loop before init**: accepted (CHANGELOG "Native looping is never used").

### critique-consumers.md

- **M1 final grep cannot pass**: accepted. Two greps in section 5/T12: a dependency-usage grep that must be empty (excludes `docs/`) and a word-level review list; the constitution edit is now unconditional (section 5, with the constitution's own amendment rule as reason); `docs/` regeneration added as release step 2 (section 9).
- **M2 T7 check matches its own text**: accepted. Schema description no longer mentions video.js (4.2), and the check is `-Pattern 'Video\.js-based' -CaseSensitive` (T7).
- **M3 "control bar" in the Was line**: accepted. Reworded per CC (8.2 first bullet); 3.x passed `controls: false, controlBar: false` (`video-position-source.ts:386-387`).
- **S1 playsinline**: accepted (CHANGELOG "Changed").
- **S2 code using the player API, controls**: accepted (migration step 4).
- **S3 schema wording for the inherited case**: accepted (CHANGELOG `options` bullet).
- **S4 step 4 asks for what 3.x required**: accepted (now step 5, reworded as an accuracy check).
- **S5 audio**: accepted (V04a; wording in 3.1, 4.3, README, CHANGELOG).
- **S6 README "player"**: accepted (8.3).
- **S7 `json` fence with comments**: accepted (two separate `json` blocks with labels outside).
- **S8 slow RED run**: accepted (T2 command with `--testTimeout=1000 --bail=5`).
- **S9 `npm ci` EPERM**: accepted (T12 uses `npm install` + `npm ls`; CI runs `npm ci`).

---

## Open questions (for the maintainer; none blocks implementation)

1. `getDuration()` keeps `Infinity` for unbounded media (RC asked for 0 for every non-finite value); justified in guarantee 9.
2. `muted` stays unset, matching 3.x; `playsinline` is new (CHANGELOG "Changed").
3. Constitution bump: the plan uses 1.3.0 → 1.4.0 (MINOR); the maintainer may prefer another number.
4. Browser behaviour beyond the spec and WebKit source (Blink not re-fetched, CB M1) is covered by the release-blocking manual check in section 9.

---

## Implementation notes (2026-11-01, where the code differed from this plan)

1. **`npm uninstall video.js` (section 5, T8)** removed the name from `devDependencies` and `peerDependencies` and pruned the lock, but left `peerDependenciesMeta["video.js"]` in `package.json`. It was deleted by hand and `npm install` was run (the fallback the table names). `npm ls video.js` prints `(empty)`; the lock has no `video.js`/`videojs`/`@videojs` entry. npm also left an empty `node_modules/@videojs` directory, which was removed.
2. **`npm run fix` (T12) now formats Markdown and YAML repo-wide** (the installed Biome formats `.md` and `.yml`). It rewrote 55 files outside this change (historical `specs/**`, `.specify/templates/**`, workflows, spec files) and reformatted the Markdown/YAML files this change edits. The unrelated files were restored to HEAD with `git checkout --`; `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `specs/TESTING-GUIDE.md`, `.specify/memory/constitution.md` and `.github/dependabot.yml` were restored and only the planned edits re-applied. TypeScript files were formatted with `npx biome check --write <changed .ts files>`, and `npm run lint` (lint only, `.ts`) is the gate. The untracked files in `specs/006-native-video-source/` (this plan, the research and critique files) were reformatted by that run and could not be restored; the changes are formatting only. Replace `npm run fix` in T12 with the targeted `biome check --write` until the Biome config excludes Markdown/YAML.
3. **Biome `lint/suspicious/noThenProperty`** rejects the `then` key of `VIDEO_OPTIONS_REMOVED` in `src/tools/schema-tools/video-options-rule.ts`. A `biome-ignore` comment explains that `then` is the JSON Schema keyword and the object is never awaited.
4. **Comments**: two comments not listed in section 5 mentioned video.js and were reworded so source comments stay free of it (the `muted` note in `_createVideoElement`, "as in 3.x"; the `check-dist-types.ts` smoke-check comment, "without any media player library"). The remaining hits of grep 2 are the expected ones (CHANGELOG, migration messages and their specs, resolver JSDoc, README upgrade line, the constitution's Sync Impact Report).
5. **Fixture**: `setMediaProperty` defines the property with `writable: true` as well as `configurable: true`, so a test can reassign a defined `currentTime`. `trackEventListeners` replays adds and removes in `invocationCallOrder`, so a listener that was removed and added again is reported correctly.
6. **S02-S05** compile the configuration schema once with `validateFormats: false`, so the new tests do not repeat the existing ajv "unknown format" warnings; S05 also asserts the error is at `/timelines/0/positionSource/options`.
7. **RED evidence**: T2 failed 69 of 83 (no native `<video>` is created synchronously by the 3.x source, and video.js 8 threw "The element or ID supplied is not valid"); T4 failed exactly R01-R04 and R08; T6 failed the W module import and S01, S02, S05.
