# Research: native HTMLVideoElement as replacement for video.js 8 in VideoPositionSource

Date: 2026-11-01. Scope: read-only research. Statuses: VERIFIED (source named) or UNVERIFIED.

Environment: jsdom 30.1.3 (node_modules\jsdom\package.json), vitest 5.0.5, environment `jsdom`, pool `vmThreads` (src\vitest.config.ts), installed video.js 8.24.2 (node_modules\video.js\package.json).

Sources used: WHATWG HTML spec https://html.spec.whatwg.org/multipage/media.html (fetched in parts and summarised by the fetch tool, so quoted wording is as relayed); MDN pages for HTMLMediaElement `play`, `load`, `currentTime`, `duration`, the `error` event, the `<source>` element and the Autoplay guide (developer.mozilla.org); node_modules\jsdom\lib\jsdom\living\nodes\HTMLMediaElement-impl.js and node_modules\jsdom\lib\generated\idl\HTMLMediaElement.js; a probe script run against the installed jsdom; node_modules\video.js\dist\video.es.js (8.24.2); a web search on source-error behaviour (https://blog.pearce.org.nz/2010/11/changes-to-html5-videoaudio-load.html, https://webkit.googlesource.com/WebKit/+/master/LayoutTests/media/video-source-none-supported.html).

## 1. HTMLMediaElement API

| Topic                              | Fact                                                                                                                                                                                                                                                                                                                                                                                                      | Status                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| play()                             | Returns a Promise. Rejects with `NotAllowedError` when autoplay policy / permissions policy / OS blocks it. `NotSupportedError` when the source is unsupported. Other errors possible.                                                                                                                                                                                                                    | VERIFIED (MDN play; MDN Autoplay guide)                                         |
| play() with pending pause()/load() | Spec: pending play promises are rejected with `AbortError` when the element pauses (including at end of playback) and when load() runs. MDN load page states the same for load(). The MDN play page does NOT document AbortError. Any play() the code later pauses needs a `.catch`.                                                                                                                      | VERIFIED (spec media.html; MDN load)                                            |
| 'play' vs 'playing'                | 'play' is queued when `paused` becomes false. 'playing' fires later, once readyState >= HAVE_FUTURE_DATA, and the same step resolves pending play promises. 'playing' is the right replacement for video.js `playing` (container ready).                                                                                                                                                                  | VERIFIED (spec)                                                                 |
| pause()                            | Sets paused, fires 'pause', rejects pending play promises with AbortError.                                                                                                                                                                                                                                                                                                                                | VERIFIED (AbortError part, spec)                                                |
| load()                             | Resets element, restarts resource selection. Fires 'abort' if networkState was LOADING or IDLE; 'emptied' if networkState was not EMPTY; then 'loadstart'. Resets position to 0 and duration to NaN (no durationchange for that reset).                                                                                                                                                                   | VERIFIED (spec; MDN load)                                                       |
| currentTime setter before metadata | If readyState is HAVE_NOTHING the value is stored as the "default playback start position"; playback starts there once metadata loads and the getter returns it; no 'seeking'/'seeked' pair at that moment. Otherwise it seeks and fires 'seeking' then 'seeked'. MDN advises setting it in 'loadedmetadata' to be safe.                                                                                  | VERIFIED (spec); MDN advice                                                     |
| duration                           | NaN when no media data; Infinity for unbounded streams; known at 'loadedmetadata'; 'durationchange' on change. Use `Number.isFinite`.                                                                                                                                                                                                                                                                     | VERIFIED (MDN duration)                                                         |
| readyState / 'canplay'             | Constants HAVE_NOTHING 0, HAVE_METADATA 1, HAVE_CURRENT_DATA 2, HAVE_FUTURE_DATA 3, HAVE_ENOUGH_DATA 4 (jsdom IDL). 'canplay' corresponds to reaching HAVE_FUTURE_DATA, 'canplaythrough' to HAVE_ENOUGH_DATA (existing code resolves init on 'canplay'). Exact spec wording not retrieved.                                                                                                                | constants VERIFIED (jsdom); event mapping wording UNVERIFIED                    |
| 'seeking' / 'seeked'               | Fired at seek start / completion (listed on MDN currentTime page). Spec detail not retrieved.                                                                                                                                                                                                                                                                                                             | existence VERIFIED; detail UNVERIFIED                                           |
| 'ended' and `loop`                 | With the `loop` attribute, at the end of forward playback the element seeks to the start and does not count as ended: no 'ended' event. Without it, `paused` becomes true then 'ended' fires. Native loop would therefore hide the 'end'/'start' boundaries the source emits today. Recommendation: leave `loop` unset and loop manually (set currentTime 0, play()), as the current `_handleEnded` does. | VERIFIED (spec)                                                                 |
| 'error' on the media element       | Fatal error after load began sets `video.error` (MediaError) and fires 'error' at the element. Codes: 1 MEDIA_ERR_ABORTED, 2 MEDIA_ERR_NETWORK, 3 MEDIA_ERR_DECODE, 4 MEDIA_ERR_SRC_NOT_SUPPORTED. The event does not bubble. `message` text is browser-defined.                                                                                                                                          | codes/non-bubbling VERIFIED (spec, MDN error event); message content UNVERIFIED |
| preload                            | none / metadata / auto; UA may ignore it. Use `auto` as the current code does.                                                                                                                                                                                                                                                                                                                            | VERIFIED (spec)                                                                 |
| poster                             | `poster` attribute on HTMLVideoElement; jsdom reflects it.                                                                                                                                                                                                                                                                                                                                                | VERIFIED (jsdom probe)                                                          |
| muted / autoplay                   | Allowed if muted or volume 0, or user interacted, or allowlisted; otherwise play() rejects with NotAllowedError. Recommended pattern `muted` + `playsinline` (Safari needs playsinline for inline autoplay).                                                                                                                                                                                              | VERIFIED (MDN Autoplay guide)                                                   |

### Multiple `<source>` children and total failure (key design point)

- VERIFIED (spec resource selection algorithm, children mode): a failed candidate gets "queue a media element task ... to fire an event named error at candidate", i.e. at the `<source>` element. When no candidates remain ("Waiting" step) the spec sets `networkState = NETWORK_NO_SOURCE`, sets the show-poster flag and stops delaying the load event. It does NOT set the media element's `error` attribute and does NOT fire `error` at the `<video>`. The element `error` attribute (MEDIA_ERR_SRC_NOT_SUPPORTED) is set only by the "dedicated media source failure steps", which run for the `src` attribute and object modes.
- Consequence: with `<source>` children `video.addEventListener('error', ...)` does not report total failure. The `player.one('error', ...)` init rejection in the current code must be rebuilt.
- `error` does not bubble (MDN error event, MDN source). Listen on the `<source>` elements directly, or on the `<video>` with capture (`addEventListener('error', h, true)`), where `event.target` is the failing source (capture on an ancestor still sees non-bubbling events targeted at descendants).
- Sources are tried in document order, so an error on the LAST `<source>` means all failed (https://blog.pearce.org.nz/2010/11/changes-to-html5-videoaudio-load.html; the WebKit layout test video-source-none-supported.html checks networkState NETWORK_NO_SOURCE when the last source errors). VERIFIED as the recommended pattern from those sources.
- Candidates skipped because their `type` is unsupported go through the same "failed" path in the spec, so they should also fire `error` at the source. Spec-derived; UNVERIFIED in real browsers.
- `networkState === NETWORK_NO_SOURCE (3)` alone is not proof (also true while waiting for more sources). Treat "error on last source" as the failure signal and optionally confirm networkState 3.
- An element in NETWORK_NO_SOURCE tries `<source>` elements appended later (same blog). Append all sources first, then (or after attaching) call `load()`.
- A source that is selected but then fails to decode/stream raises a media-element error (`video.error`, codes 2-4). Register both listeners: capture 'error' on the video; if `event.target === video` use `video.error`; if target is the last source, total failure. Cross-browser differences UNVERIFIED (no live browser used in this run).
- Alternative: choose the first playable source ourselves with `video.canPlayType(type)` ('' / 'maybe' / 'probably'; jsdom returns '') and set `video.src`; total failure is then a plain video-level 'error' with a MediaError. Downside: no automatic fallback after a network error. The maintainer decision says to append `<source>` children, so use children plus the last-source detector.

## 2. jsdom 30.1.3 limitations (VERIFIED: HTMLMediaElement-impl.js and a probe run)

HTMLMediaElement-impl.js is a stub. `load()`, `play()`, `pause()` and `addTextTrack()` call `notImplementedMethod`, which emits a `jsdomError` ("Not implemented: HTMLMediaElement's play() method") on the window's virtual console and returns undefined (grep of the file: lines 100-112). Probe results:
- `play()` returns `undefined`, NOT a Promise. `video.play().catch(...)` throws TypeError under jsdom. Use `Promise.resolve(video.play())` or `video.play()?.catch(...)`; in tests mock with `mockResolvedValue` / `mockRejectedValue`.
- `load()` and `pause()` are no-ops with the Not implemented error. No media events ever fire ('loadstart', 'loadedmetadata', 'canplay', 'error', 'emptied', 'abort'). HTMLSourceElementImpl is an empty class; `<source>` children never load. Probe: after `load()` with a `<source>` child, zero events in 300 ms. 'canplay' never fires on its own.
- `currentTime` is a plain settable value (set 5, read 5): no clamping, no 'seeking'/'seeked'/'timeupdate'.
- `duration` is NaN; the IDL has a getter only. Assignment is silently ignored in sloppy mode and throws TypeError in strict mode (ES modules). Use `Object.defineProperty(video, 'duration', {configurable: true, value: 42})` (probe confirmed).
- `readyState` and `networkState` are 0, `paused` true, `ended`/`seeking` false; `buffered`/`seekable`/`played` are empty dummy ranges; `canPlayType()` returns ''.
- jsdom has NO `error` property on HTMLMediaElement (probe: `'error' in video` false). `video.error?.code` is undefined; tests must define it with `Object.defineProperty(video, 'error', {configurable: true, value: {code: 4, message: ''}})`. Source code must read it defensively.
- Works in jsdom: reflection of `preload`, `poster`, `loop`, `autoplay`, `playsInline` (serialises as `playsinline`), `crossOrigin`; `muted` and `volume` as properties (the `muted` attribute maps to `defaultMuted`); 'ratechange'/'volumechange' events. HAVE_*/NETWORK_* constants exist.

Standard test approach under vitest's jsdom (`restoreMocks`/`clearMocks` are on in this repo, so spies reset per test):
1. Reset `document.body.innerHTML` and create the container in `beforeEach`.
2. `vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)`; `.pause` and `.load` with `mockImplementation(() => {})`. This also silences the Not implemented noise.
3. Get the element with `container.querySelector('video')`; define read-only members per instance with `Object.defineProperty(video, 'duration' | 'error' | 'readyState' | 'networkState', {configurable: true, value})`; assign `currentTime` directly.
4. Drive the lifecycle with `video.dispatchEvent(new Event('canplay'))`, 'timeupdate', 'seeked', 'ended', 'playing', 'emptied'. For failure: `lastSource.dispatchEvent(new Event('error'))` (a plain non-bubbling Event, like browsers) and `video.dispatchEvent(new Event('error'))`.
5. Put a reusable fake-video helper (installs the spies, exposes emit helpers) in `src\test\fixtures\` as TESTING-GUIDE.md requires. No such fixture exists today (only a video.js mock inside the spec).
6. Stub other globals with `vi.stubGlobal`, never by assignment.
7. The `vi.mock('video.js')` / `vi.hoisted` block in src\test\unit\timelineproviders\position-sources\video-position-source.spec.ts must go. Other test files mentioning video.js (grep hits): src\test\unit\configuration\api\node-environment.spec.ts and src\test\unit\configuration-api.spec.ts; contents not inspected.

## 3. video.js 8 behaviours the native element does not give for free

Checked against node_modules\video.js\dist\video.es.js (8.24.2) unless noted.

| video.js 8 behaviour                                                                                                                                                                                                                           | Replacement                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources` option goes through `player.src()` and `selectSource()` (line ~24936), which picks the first source a tech's `canPlaySource` accepts. Empty list: async error code 4 (~25024). Retry of next source via `handleSrc_` (~25006-25078). | Append one `<source src type>` per entry in array order. The browser picks the first playable (it skips unsupported `type` without a request, MDN source) and falls back to the next on failure. Keep the existing guard rejecting init on an empty or missing `sources` array before creating anything. |
| `ready(fn)` (line 4268): runs when the tech is ready, asynchronously.                                                                                                                                                                          | Not needed: the element exists synchronously. Attach listeners BEFORE appending sources and calling `load()`; resolve init on 'canplay' (also resolve at once if `readyState >= HAVE_FUTURE_DATA`).                                                                                                      |
| `player.error()` returns a MediaError wrapper or null, adds `vjs-error` class, code 4 for no compatible source (~25649).                                                                                                                       | Use `video.error` for media-element errors and the last-source error pattern for total failure; keep the current message format `failed to load video (srcs)[: message]`.                                                                                                                                |
| Adds class `video-js` (line ~22369) plus wrapper div, poster element, big-play button, control bar, error display and CSS.                                                                                                                     | Not replicated. Consumer CSS targeting `.video-js` / `vjs-*` stops applying (CHANGELOG note). Native `<video>` without `controls` shows no UI. Poster uses the native `poster` attribute. Default sizing may need a style (open question).                                                               |
| `dispose()` (lines 6136, 8558, 10816): removes DOM, listeners, tech, timers.                                                                                                                                                                   | Manual cleanup, see section 4.                                                                                                                                                                                                                                                                           |
| `player.on/one/off` event bus.                                                                                                                                                                                                                 | `addEventListener` (with `{once: true}`) and the tracked `_eventHandlers` list.                                                                                                                                                                                                                          |
| `player.currentTime()` / `duration()` as functions.                                                                                                                                                                                            | Properties; `duration` is NaN until metadata, so `getDuration()` should return 0 when not finite (base starts at 0).                                                                                                                                                                                     |
| `play()` may return undefined on old players.                                                                                                                                                                                                  | Native play() returns a promise in current browsers (old browsers UNVERIFIED); wrap in `Promise.resolve(...)` to also survive jsdom.                                                                                                                                                                     |
| Tech layer, built-in HLS/DASH (VHS), `techOrder`, `options` passthrough.                                                                                                                                                                       | Out of scope: no m3u8/mpd per maintainer, `options` removed by decision. Only browser-native formats play (Safari plays HLS natively; other browsers do not: UNVERIFIED here). CHANGELOG migration should say HLS/DASH users must stay on 3.x.                                                           |
| Options `controls:false`, `controlBar:false`, `liveui:false`, `autoplay:false`.                                                                                                                                                                | Native defaults: no controls, no autoplay; set none of those attributes.                                                                                                                                                                                                                                 |

## 4. Recommended minimal element setup

Create with DOM APIs, not an HTML string (no escaping problems in `src`/`poster`):

```ts
const video = document.createElement('video');
video.preload = 'auto'; // matches current preload: 'auto'
video.controls = false; // default, explicit for clarity
video.playsInline = true; // iOS inline playback (MDN Autoplay)
// video.muted: maintainer decision, see open question 5
if (poster !== undefined) video.poster = poster;
// do NOT set loop: loop manually to keep 'end'/'start' boundaries
// attach listeners first: canplay, playing, timeupdate, ended, capture 'error' on video,
// 'error' on the LAST <source>
for (const s of sources) {
  const el = document.createElement('source');
  el.src = s.src;
  el.type = s.type;
  video.appendChild(el);
}
container.appendChild(video); // then video.load() (safe, mirrors current player.load())
```

Keep a direct reference to the element instead of looking it up by id (`$('#id')`); an id is optional.

Init settlement: resolve on first 'canplay' (or immediately if `readyState >= 3`); reject with `VideoPositionSource: failed to load video (<srcs>)[: message]` on last-source error or video 'error'; reject if destroyed first (the existing `_pendingInit` logic carries over).

Seek: set `video.currentTime = position`, resolve on 'seeked' with `video.currentTime`, settle on 'error', 'emptied' or destroy (port of the existing logic). Caveat: before metadata (readyState 0) the spec stores a default start position and fires no 'seeked', so the promise would hang. Guard on readyState and resolve with the requested position in that case.

Container ready: first 'playing' event.

Destroy: remove listeners, settle pending init/seeks (existing code), then:

```ts
video.pause();
video.querySelectorAll('source').forEach(s => s.remove()); // before load(), else load() re-selects them (MDN load)
video.removeAttribute('src');
video.load(); // aborts the fetch and releases the decoder (listeners already removed)
video.remove();
```

`pause()` rejects a still-pending play() with AbortError: swallow it (`.catch(() => {})`) on the promise the source created; startTicking's own rejection must still reach activate() for genuine NotAllowedError, but an AbortError after deactivate/destroy should be ignored.

## Open questions / UNVERIFIED

1. Total-source-failure behaviour was verified from the spec, an old blog and a WebKit test only; no live Chrome/Firefox/Safari run. Recommend a manual browser check later.
2. Whether `error` fires at `<source>` elements skipped for unsupported `type` in all browsers (spec-derived only).
3. Whether 'seeked' fires when currentTime is assigned its current value; exact seek-before-metadata behaviour in browsers.
4. Exact spec wording for 'canplay'/readyState transitions and 'seeking'/'seeked' (fetch excerpts did not cover it).
5. Muted default: video.js did not mute. Add an optional `muted` config key (additive) or keep unmuted and surface NotAllowedError? Needs a maintainer decision; the config shape is otherwise frozen.
6. Default sizing/styling to replace the removed `video-js` class (e.g. `width: 100%`)?
7. Contents of node-environment.spec.ts and configuration-api.spec.ts regarding video.js were not inspected.
8. MediaError.message content per browser.
