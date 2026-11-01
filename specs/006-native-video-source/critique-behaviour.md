# Critique (behaviour): plan.md for the native VideoPositionSource

Date: 2026-11-01. Lens: runtime behaviour of the planned `video-position-source.ts` against the current file (read in full) and the engine's use of position sources (`eligius-engine.ts` `_start` :512-533, `pause` :539-551, `stop` :564-580, `seek` :600-667, `_switchTimeline` :758-839, `_prepareSource`/`_initializeComponent` :984-1125, `_destroy` :1165-1229, `_seekSource`/`_onTimeHandler` :1545-1579) and `base-position-source.ts`.

Points that held up and are not repeated here: AbortError from a pending `play()` (always a superseded activation), seek settle on `seeked`/`error`/`emptied`/destroy, listener bookkeeping, the NaN-to-0 duration (NaN never reaches the engine as position or duration), N1-N3 (retry after a failed init, idempotent init, init after destroy), first-position reconcile after `start()`/`switchTimeline()` (also with a shared source whose `deactivate()` seek to 0 is still running), and `ended` without loop.

---

## Must-fix

### M1. "Error on the LAST `<source>`" misses total failure in WebKit and Blink, so `init()` never settles where 3.x rejected

**Claim in the plan.** Guarantee 4 (plan.md:42) and `_handleInitError` (plan.md:268-283): an error on an earlier `<source>` is ignored because "the browser tries the next one". Total failure is recognised only when the error target is `this._sourceElements.at(-1)`. JSDoc 3.8 (plan.md:496) and CHANGELOG "Changed" (plan.md:998) promise that `init()` "rejects when every source fails".

**Evidence.** WebKit `Source/WebCore/html/HTMLMediaElement.cpp` (main, fetched 2026-11-01, https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/HTMLMediaElement.cpp):
- `mediaLoadingFailed` (≈:3142-3170). When the current `<source>` fails before metadata, it queues `error` at that source and then calls `havePotentialSourceChild()`. If that returns false it calls `waitForSourceChange()` and does not continue.
- `havePotentialSourceChild` (≈:6069-6080) calls `selectNextSourceChild(nullptr, InvalidURLAction::DoNothing)`.
- `selectNextSourceChild` (≈:6150-6182) skips candidates with an unsupported `type` or an unsafe/invalid URL by jumping to `CheckAgain`, which fires `source->scheduleErrorEvent()` only `if (actionIfInvalid == InvalidURLAction::Complain)`.

So when a viable source fails at fetch time and every remaining source is non-viable, the remaining sources, including the last one, get no `error` event. The element just waits in `NETWORK_NO_SOURCE` (`waitForSourceChange`, ≈:2976-2984). Blink's `html_media_element.cc` comes from the same code and has the same `HavePotentialSourceChild`/`kDoNothing` structure. I did not re-fetch Blink; it should be checked, but the WebKit case is enough on its own. RN "Open questions" 1-2 already flagged this as UNVERIFIED, and the plan left it as an "advisable" manual check (plan.md:1050).

**Concrete sequence (Safari).** `sources: [{src: '/intro.mp4', type: 'video/mp4'}, {src: '/intro.ogv', type: 'video/ogg'}]`, and `/intro.mp4` returns 404.
1. `load()` makes `intro.mp4` the candidate (`intro.ogv` is not considered yet).
2. The fetch fails, and `error` fires at `<source intro.mp4>`. The plan sees a non-last target and returns (plan.md:278-279).
3. `havePotentialSourceChild()` finds no viable candidate (Ogg is unsupported), so no `error` fires at `<source intro.ogv>` and the element waits.
4. Neither `canplay` nor an accepted `error` ever arrives, so `init()` stays pending forever.

The same happens in Chrome with a last source of an unsupported type (for example `video/quicktime`), or with an empty `src` after a failing first source.

**3.x outcome.** video.js uses `src`-attribute mode. It picks the first source its tech accepts and sets `el.src`. A 404 is then a video-level `error`. The current `player.one('error', ...)` (video-position-source.ts:418-428) rejects init on it. It fires on the same `error` that video.js's own retry handler listens to (`node_modules/video.js/dist/video.es.js:25076-25092`). 3.x therefore rejected; the plan hangs.

**Why it matters.**
- `engine.init()` never resolves and never emits `initialized` (eligius-engine.ts:939).
- `switchTimeline()` to that timeline blocks the transport queue for good (:788), so every later `start`/`seek`/`switchTimeline` waits behind it.
- `engine.destroy()` skips a source that is still initialising (:1220) and destroys it only "when its init settles" (:1105-1125), which never happens. The `<video>` element and its network connection therefore leak.

This breaks guarantee 4 as the plan states it, and it makes the JSDoc and the CHANGELOG line at plan.md:998 wrong.

**Concrete fix.**
1. In `_handleInitError`, for an error whose target is a `<source>`, reject when the target is the last source OR `video.networkState === 3` (`NETWORK_NO_SOURCE`, a module constant like `HAVE_NOTHING`). This works because in WebKit/Blink `waitForSourceChange()` sets `NETWORK_NO_SOURCE` synchronously in the same run that queues the source's `error` task, so the handler sees 3 only when no candidate is left. When a next candidate is scheduled, the state is still `NETWORK_LOADING`. Keep the last-source rule for Gecko, which fires `error` at every skipped source.
2. Optional hardening: at init, do not append (or reject on) sources whose `video.canPlayType(type) === ''`. This mirrors video.js's immediate code-4 error. jsdom returns `''`, so the fixture would have to stub `canPlayType`.
3. Add tests:
   - V12b: `given two sources, when the first fires error while networkState is NETWORK_NO_SOURCE, then init() rejects with 'none of the sources could be played'`.
   - V13 must set `networkState` to 2 (`NETWORK_LOADING`) before the first-source error, so it keeps proving the fallback.
4. Promote plan Open question 4 to a release blocker: a manual check in Safari and Chrome with `[404 mp4, unsupported type]`.
5. CHANGELOG "Changed" must also say: in 3.x a failing first source rejected `init()`; in 4.0 the browser falls back to the next source and `init()` rejects only when no source is left.

---

## Should-fix

### S1. `seek()` can still hang forever on the other spec branch with no `seeked`, or after a fatal media error

**Claim.** Guarantee 7 (plan.md:45) says "`seek()` always settles". It adds a `HAVE_NOTHING` early return because no `seeked` fires in that state (plan.md:363-368).

**Evidence.** The WHATWG seek algorithm (https://html.spec.whatwg.org/multipage/media.html#dom-media-seek) has a second silent return: "If there are no ranges given in the seekable attribute, then set the seeking IDL attribute to false and return." Separately, after a fatal `MEDIA_ERR_NETWORK` or `MEDIA_ERR_DECODE` once metadata is loaded, `readyState` stays at 1 or more. A later seek gets no new `error` (it already fired) and no `emptied`, and the data never arrives, so no `seeked` either.

**Sequence.** The video plays, then the network drops: `error` fires at the video, `video.error.code` is 2, and the source is still `active`. Then `engine.seek(20)`: `_seekSource` waits on `source.seek(20)`, which never settles. `stop()` does not help, because its `deactivate()` seek to 0 hangs the same way. The transport queue stays blocked until `destroy()`, which settles pending seeks. 3.x behaves the same, but the plan claims the contract is fixed.

**Fix.** At the top of `seek()` after the null check, add `if (video.error) { return video.currentTime; }`. Optionally also return early when `video.seekable.length === 0` (assign `currentTime`, resolve with it). jsdom's `seekable` is an empty dummy, so `makeReady()` in the fixture would then have to define `seekable` with one range. Add a test for each early return.

### S2. Loop replay plays a suspended source when an `end` listener pauses the engine

**Claim.** Guarantee 10 (plan.md:48) ports `_handleEnded` unchanged (plan.md:414-430).

**Evidence.** `emitBoundary('end')` runs engine callbacks synchronously. `_onCompleteCallback` (eligius-engine.ts:1127-1130) emits `timelineComplete`. `EngineEventbusAdapter` broadcasts `timeline-complete` synchronously (src/adapters/engine-eventbus-adapter.ts:98-99) and maps `timeline-pause-request` to `engine.pause()` (:146-147).

**Sequence.** `loop` is true and a `timeline-complete` listener broadcasts `timeline-pause-request`:
1. `emitBoundary('end')` leads to `engine.pause()`, then `source.suspend()`; the state is `suspended`.
2. Back in `_handleEnded`, `currentTime = 0`, `emitBoundary('start')` (the engine emits `timelineRestart` while paused), then `video.play()`.
3. The video now plays audibly while `playState` is `'paused'` and every `timeupdate` is ignored.

3.x has the same bug, but this is the moment to fix it.

**Fix.** After each `emitBoundary(...)` in `_handleEnded`, add `if (this.state !== 'active') return;`. Add a test: `given loop true and an end callback that suspends the source, when ended fires, then play() is not called again`.

### S3. A source without `type` worked in 3.x and fails (or, with M1, hangs) in 4.0

**Evidence.** video.js's `fixSource` (video.es.js:10005-10012) derives `type` from the file extension when it is missing. The plan always writes `element.type = type` (plan.md:242-247). With `type` undefined (JS callers, `new VideoPositionSource(...)`, or configurations that bypass the schema: the resolver only checks for a non-empty array, configuration-resolver.ts:385-397), the attribute becomes `type="undefined"`. The browser treats that as unsupported and skips the source.

**Fix.** Either set the `type` attribute only when `type` is a non-empty string, so the browser sniffs the media, or reject in `init()` with a message naming `sources[i].type`. Add a test, and add a CHANGELOG line if you choose to reject.

### S4. CHANGELOG seek and duration lines are imprecise

- plan.md:1000 says "`seek()` before the metadata is loaded resolves at once with the requested position; the video starts there." Before `init()` there is no element: `seek()` returns `getPosition()` and does nothing (plan.md:360-362). Reword to "between `init()` and the media's metadata". In 3.x such a seek was deferred by video.js (`initTime` applied on `canplay`, video.es.js:24074-24078) and resolved on that later `seeked`.
- plan.md:47 (guarantee 9) says 3.x returned "0 before metadata". It did not: video.js `duration()` returns `NaN` until it is known (video.es.js:24113-24117), and `?? 0` does not catch NaN. Correct the table, and make the CHANGELOG line at plan.md:999 say "0 instead of NaN".

### S5. CHANGELOG HLS sentence asserts something unverified

plan.md:972: "(Safari still plays HLS natively; other browsers do not)". RN:76 marks this UNVERIFIED, and it is wrong at least for Chrome on Android, which plays HLS natively. Reword to: "HLS and DASH play only where the browser supports them natively, which is not portable; stay on 3.x if you need them."

### S6. Wrong reasoning about the activation token in 3.4

plan.md:351 says `suspend()`/`deactivate()`/`destroy()` each "bumps the activation token first". The `VideoPositionSource.deactivate()` override (plan.md:335-346) calls `stopTicking()` (that is, `pause()`) before `super.deactivate()` bumps the token, and `stopTicking()` then runs a second time inside `super.deactivate()` because the state is still `active`. The result is correct only because the AbortError for the pending `play()` is delivered in a later media-element task. Correct the sentence so a later refactor does not rely on the false ordering. V36 covers `suspend` only; add the same play/deactivate/play case.

### S7. `loop` set before `init()` changes behaviour

3.x passed `loop: this.loop` to the player (video-position-source.ts:391). A direct user who set `loop = true` before `init()` got native looping with no `end`/`start` boundaries. 4.0 never sets native loop (V09), so boundaries now fire. The engine is not affected, because it sets `loop` after init (eligius-engine.ts:809, :944). Add one line to the CHANGELOG "Changed" section.
