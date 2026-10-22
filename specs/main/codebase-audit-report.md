# Eligius codebase audit (2026-10-21)

## Verdict

**mature-plus-targeted-expansion.** Fix first. Forty confirmed bugs, including two criticals in the core clock (RafPositionSource reads absolute RAF timestamps as elapsed time and never re-bases on seek/resume) and a stack overflow on any 'language-change' broadcast, mean a factory-created engine does not work as documented today: play-toggle cancels itself, every tick and timeline-complete is broadcast twice, switched-to timelines run on an uninitialised or destroyed source, subtitles never match video positions, the fluent editors silently drop edits, the schema generator rejects valid configs, and a JSON configuration can pollute Object.prototype and reach Function. The tests are broad by count but mock every collaborator, so none of the composed paths (EngineFactory.createEngine -> destroy, adapter plus engine, real Eventbus plus LocaleManager) are exercised. Nothing should be added until those 40 land and the first integration suite that drives a factory-built engine with a real RafPositionSource and real Eventbus exists.

The verdict is nevertheless mature-plus-targeted-expansion rather than fixes-only, for one reason: the feature surface (about 72 operations, 8 controllers, 4 position sources, typed eventbus, fluent API, DOM-free metadata entry) is complete for its purpose, and all three proposers independently declined to propose new operations, controllers or the speculative position sources. What they proposed instead is structural: four of the five items I recommend are the correct shape of fixes for confirmed bugs (interval dispatch for the exact-key and skipped-position bugs; fail-fast registration for the undefined-instance bug; per-timeline sources for the shared-source and switchTimeline bugs; an error event so fire-and-forget action failures stop escaping as unhandled rejections). Treating them as point fixes would leave the underlying design in place and the bugs would recur. The fifth, lazy optional peers, is small integration hardening on code paths the fix pass touches anyway. No new subsystems, no jQuery removal, no framework wrappers, no scrubbed-animation runtime.

Ordering rule: every recommended item names the confirmed bugs that must land first. The engine/adapter double-wiring fix (src/eligius-engine.ts:481, 505, 568 and src/adapters/engine-eventbus-adapter.ts:137) is a prerequisite for all five, because until it lands nothing observed through a factory-built engine can be trusted.

| Count | |
|---|---|
| Confirmed bugs | 105 |
| Uncertain bugs (verified) | 0 |
| Unverified bug reports (over cap) | 0 |
| Refuted bug reports | 5 |
| Duplicates of other confirmed bugs | 4 |
| Improvements | 42 |
| Optimisations | 5 |
| Expansions recommended | 5 |

Verification: 40 reports were checked by Sonnet skeptics in the audit run (0 refuted, which is a weak signal), 75 by Opus skeptics in a second run (5 refuted, 4 marked duplicate, severities corrected). Each entry names its verifier model. "Confirmed" means an independent reader traced the failure through the real code; the repro test name is what turns it into a reproduced failure.

### Health by area

- **controllers**: This slice is not mature. BaseController, LabelController and MutationObserverController are fine. LottieController, NavigationController, RoutingController and SubtitlesController have real lifecycle and logic defects. Several of them are hidden by tests that work around the bug: they pre-seed labelData, force endPosition=-1 and never assert the replaced text. The biggest risks are LottieController, which leaks or tears down the wrong animation on detach and has label localisation that is broken end to end, and SubtitlesController, which uses an exact-key time lookup that never matches the fractional positions from VideoPositionSource. Test coverage is broad by count (about 166 tests) but shallow: it mostly checks that listeners get registered, not what the user sees.
- **operations-a**: This slice is mostly mature. The operations are small, typed, and follow the remove-erased-properties pattern consistently, and nearly every file has a unit spec. The biggest risk is control flow: breakForEach and continueForEach do nothing when called inside a when block, because they run on the pushed when-scope, which has no loop bookkeeping. customFunction rejects any synchronous custom function that returns a non-promise value. Unit tests mostly cover happy paths with mocks. Composite flows (break or continue inside when), sync custom functions, falsy or edge inputs, and DOM-escaping are untested.
- **lens-security-robustness**: This slice is not mature on security. Property-chain resolution has no guard against __proto__, constructor or prototype keys. Because of that, a JSON configuration can pollute Object.prototype through setData, and can reach the Function constructor and run arbitrary code through setOperationData plus invokeObjectMethod. I confirmed all three with a temporary vitest run. Several DOM sinks (createElement, LabelController, SubtitlesController, NavigationController) build HTML from configuration strings without escaping. Robustness is uneven. Nested values in setOperationData are not resolved. `when` cannot compare quoted string literals. Lookups of an unknown operation, Math function or hash id fail with bare TypeErrors that do not name the operation. The happy paths are tested well; there are no tests for hostile or malformed input.
- **operations-b**: This slice is broad and well covered for the simple, happy-path operations, but it is not mature in the parts the focus list names. I confirmed every bug below with a temporary vitest probe, which I deleted afterwards. The worst ones are in property-chain resolution and control flow: setData lets configuration pollute Object.prototype, there is no guard against reaching Function through the chain, resolvePropertyValues never resolves nested objects or arrays in what it returns, and `when` mishandles both string literals and nested blocks. Tests cover single-level, flat-scalar cases, so none of these paths are exercised.
- **eventbus-locale-util**: This slice is only partly mature. The utilities and TypedEventEmitter are solid. The Eventbus core has a real re-entrancy defect: handlers are iterated live, so once() and off() during a broadcast skip other handlers or recurse. The locale subsystem has the biggest risk. Broadcasting 'language-change' on a fully wired engine overflows the stack, because setLocale always emits, and LocaleLoader is exported but never wired in, so $ref locales silently produce empty translations. Tests cover the happy paths only. Nothing tests re-entrant broadcasts, adapter plus manager round-trips, diamond $refs, real global fetch, or error and abort paths.
- **timeline-providers-adapters**: This slice is not mature. The interfaces and lifecycle scaffolding in BasePositionSource are clean and well tested in isolation, but the tests mock every collaborator (animationInterval, video.js, the eventbus, LocaleManager, the engine), and that hides several severe integration defects. The worst are: RafPositionSource reads absolute RAF timestamps as elapsed time and ignores resume/seek; a `language-change` broadcast on the real Eventbus overflows the stack (reproduced with tsx: RangeError after 861 recursions); and EngineEventbusAdapter wires the same commands the engine already handles, so play-toggle cancels itself and seek/switch run twice. Out of scope but related: the engine only applies `timeline.loop` to the position source in switchTimeline, never for the first timeline, and in switchTimeline it destroys the old source and may reuse it later.
- **lens-performance**: This slice is not mature. The per-tick lookup is O(1) and cheap. The problem is the time source and how positions are dispatched. RafPositionSource reads absolute RAF timestamps as if they were elapsed time, and seek/resume never re-base its clock. The engine also starts actions only on an exact float-key match, so positions that video, scroll or keyboard sources emit, or that get skipped, never trigger actions. Action.executeOperation recurses once per operation and deep-copies data on every execution. I measured both: a forEach over 6000 items overflows the stack, and copying cost grows quadratically with loop length. The tests hide most of this. The RafPositionSource spec mocks animationInterval and passes elapsed milliseconds, no test covers animation-interval.ts, and the engine spec writes the skip-a-key behaviour in as expected.
- **configuration-tools**: This slice is not mature. ConfigurationResolver works on the happy path. The fluent editor API is broken, though: every edit made through ConfigurationFactory.editAction/editInitAction/editTimelineAction is silently lost, because the editors copy the action object and never write it back. I confirmed this with a temporary vitest spec, since deleted. The schema generator also emits schemas that reject valid configurations: @dependency properties are marked required, and 8 operations have no schema at all. The resolver does not fail fast on unknown operation names. The tests run each editor against a stub `{}` factory, so no test checks that a factory/editor round trip reaches getConfiguration(). There are no tests for src/tools at all.
- **engine-core**: This slice is not mature. Single-timeline playback through a directly built EligiusEngine works and is well unit-tested. But when the engine is created through EngineFactory, both the engine's own eventbus handlers and EngineEventbusAdapter handle every request and broadcast every event, so play-toggle, seek and timeline switching are broken, and every tick broadcasts timeline-time twice. Timeline switching, timelines of different types, fractional or non-monotonic positions (video, scroll, keyboard), stop/loop cleanup and destroy error paths all have concrete defects. The tests mostly use mocked position sources against a bare engine, so none of these paths are covered. A temporary probe spec, since deleted, confirmed several of them: one start() gives 2 timeline-play broadcasts, toggle never changes playState, switching to a 20s timeline reports duration 10, and one request-timeline-uri gives 4 timeline-current-timeline-change broadcasts.
- **lens-lifecycle-memory**: This slice is not mature on lifecycle. Each class tracks the listeners it registers itself (BaseController, the adapters, EngineEventbusAdapter), but the pieces do not line up when composed. Wiring is duplicated between EligiusEngine and EngineEventbusAdapter, factory-level registrations outlive the engine's destroy(), the adapters are disconnected before end operations that still need them, and a switched-to position source is never initialised or wired. The biggest risk is EngineFactory.createEngine().destroy(): it can reject partway through, leaving position sources ticking and eventbus handlers attached, and it leaves an interceptor and event-action listener behind on the shared eventbus. Unit tests mock position sources, hotkeys, lottie and animationInterval, and integration tests call engine.destroy() directly instead of the factory result's destroy(). So the composed lifecycle is almost entirely untested.

## Confirmed bugs

### 1. [critical] RafPositionSource treats absolute RAF timestamp as elapsed time

[raf-position-source.ts:150](src/timelineproviders/position-sources/raf-position-source.ts#L150) · area: timeline-providers-adapters · reported severity: critical · verifier: sonnet

**Summary.** animationInterval calls back with the requestAnimationFrame DOMHighResTimeStamp (milliseconds since page time origin), but _onTick computes position as `time - _startTimeOffset` with `_startTimeOffset` initialised to 0. In a real browser the first tick jumps to the page's uptime in seconds instead of advancing from 0.

**Failure scenario.** The page has been open 45 s. The user starts a 60 s animation timeline. The first real tick has time ~46000, so position becomes 46 and all actions between 0 and 46 are skipped. If the page has been open longer than the duration, the first tick emits 'end' and the timeline completes immediately.

**Evidence.**

```ts
util/animation-interval.ts: `const frame = (time: number) => { if (signal.aborted) return; callback(time); ...}; ... setTimeout(() => requestAnimationFrame(frame), delay);`
raf-position-source.ts: `private _startTimeOffset = 0;` ... `const elapsedSinceStart = time - this._startTimeOffset; const ticksElapsed = Math.floor(elapsedSinceStart / this._tickInterval); const newPosition = (ticksElapsed * this._tickInterval) / 1000;`
Doc comment: `@param time - Elapsed time in milliseconds from animationInterval` (wrong). Tests mock animationInterval and pass 1000, 2000, ...
```

**Fix.** In startTicking, record basePosition = this.getPosition() and set an anchor on the first tick (anchor = time of first callback, or the start value used by animationInterval). In _onTick compute position = basePosition + floor((time - anchor)/tickInterval)*tickInterval/1000. Reset the anchor and basePosition on every startTicking (resume) and on loop wrap. Fix the doc comment and add a test that uses the real animationInterval with fake timers and a stubbed requestAnimationFrame passing performance.now().

Original suggestion: In startTicking, capture the anchor on the first tick (or from document.timeline.currentTime / performance.now()) and compute position as basePosition + (time - anchor). Add a test that runs the real animationInterval with fake timers and a stubbed requestAnimationFrame that passes performance.now().

**Verifier.** Traced the real code. animationInterval (util/animation-interval.ts) calls `callback(time)` with the raw requestAnimationFrame timestamp, which is absolute ms since the page time origin. RafPositionSource.startTicking passes `_onTick` straight through, and `_onTick` computes `time - this._startTimeOffset` at line 150. `_startTimeOffset` starts at 0 and is only updated on loop wrap, so on the first tick position is floor(pageUptime/tickInterval) seconds. BasePositionSource only calls startTicking() and has no anchor logic. Nothing else in the file or the base class corrects for it. The doc comment ("elapsed since interval started") is wrong. The unit tests mock animationInterval and feed 1000, 2000, ..., so they never exercise a real rAF timestamp. Consequences: any non-looping animation timeline started after the page has been open for t seconds starts at about t. If t is at least the duration, it emits 'end' on the first tick. Resume after suspend/pause has the same flaw, because the position is derived from the absolute time and the offset is never re-anchored; seek() is also ignored by the next tick. No guard or invariant makes this unreachable, and a default RAF timeline config triggers it. Critical is justified for the RAF source. It is not strictly total because a freshly loaded page starting within the first second looks fine.

**Repro test.** `given RafPositionSource with duration 60 and real animationInterval, when the first rAF callback fires with an absolute timestamp of 46000ms, then the first emitted position is 0 or 1 (not 46) and no end boundary is emitted`

### 2. [critical] LocaleEventbusAdapter recurses infinitely on language-change

[locale-eventbus-adapter.ts:83](src/adapters/locale-eventbus-adapter.ts#L83) · area: timeline-providers-adapters · reported severity: critical · verifier: sonnet

**Summary.** The adapter listens for 'language-change' on the eventbus and calls setLocale. LocaleManager.setLocale always emits 'change', even when the locale did not change, and the adapter forwards 'change' by broadcasting 'language-change' on the same eventbus. That re-enters its own listener with no end.

**Failure scenario.** With the real Eventbus and LocaleManager, eventbus.broadcast('language-change', ['nl-NL']) throws `RangeError: Maximum call stack size exceeded` (reproduced with tsx: 861 lang-attribute writes before the overflow). Any language switch from a LabelController, a navigation UI or an operation crashes. Unit tests use a mock eventbus and a mock locale manager, so they cannot see this.

**Evidence.**

```ts
`this._onLocaleEvent('change', (newLocale, _oldLocale) => { this._setRootElementLang(newLocale); this._eventbus.broadcast('language-change', [newLocale]); });`
`this._onEventbusEvent('language-change', (language: TLanguageCode) => { ... this._localeManager.setLocale(language); ...});`
locale-manager.ts: `setLocale(locale) { const previousLocale = this._locale; this._locale = locale; this._rosetta.locale(locale); this._emit('change', locale, previousLocale); ...}`
```

**Fix.** In the adapter's 'language-change' handler, return early if `language === this._localeManager.locale`. Also make LocaleManager.setLocale a no-op when the locale is unchanged. Better still, separate command from notification: the adapter should listen on a distinct request event and broadcast 'language-change' only as the notification. Add an integration test with the real Eventbus and LocaleManager.

Original suggestion: Separate command from notification: listen on a 'language-change-request' event, or skip setLocale when `language === this._localeManager.locale`. Also make LocaleManager.setLocale a no-op when the locale is unchanged. Add an integration test with the real Eventbus and LocaleManager.

**Verifier.** Traced and reproduced. engine-factory.ts:205 wires LocaleEventbusAdapter with the real Eventbus and LocaleManager. The adapter subscribes to eventbus 'language-change' (line 83) and calls localeManager.setLocale. setLocale (locale-manager.ts:185) has no unchanged-locale guard and always emits 'change'. The adapter's 'change' handler (line 62-65) broadcasts 'language-change' on the same bus, which re-enters the line-83 handler. The availability check only rejects unknown locales, so it does not stop the loop. Eventbus._callHandlers has no re-entrancy guard. I ran a tsx script with a real Eventbus, LocaleManager and adapter and a stub engine, with locales en-US and nl-NL loaded. Calling eventbus.broadcast('language-change', ['nl-NL']) threw RangeError: Maximum call stack size exceeded. The unit tests mock the eventbus or the locale manager, so none exercises the loop. This is reachable from valid configuration, since LabelController, language selectors or any operation broadcasting 'language-change' trigger it. Severity stays critical: it is a hard crash of language switching.

**Repro test.** `given real Eventbus, LocaleManager (en-US and nl-NL loaded) and a connected LocaleEventbusAdapter, when eventbus.broadcast('language-change', ['nl-NL']) is called, then it does not throw, localeManager.locale is 'nl-NL', and 'language-change' handlers run exactly once`

### 3. [high] setLocale always emits 'change'; language-change broadcast recurses to stack overflow

[locale-manager.ts:190](src/locale/locale-manager.ts#L190) · area: eventbus-locale-util · reported severity: critical · verifier: sonnet

**Summary.** ILocaleManager says setLocale emits 'change' only if the locale differs, but the implementation emits every time. LocaleEventbusAdapter turns 'change' into a 'language-change' broadcast and also calls setLocale when it hears 'language-change'. One broadcast therefore loops forever. Reproduced with real Eventbus, LocaleManager and LocaleEventbusAdapter: RangeError 'Maximum call stack size exceeded' after 863 change events.

**Failure scenario.** Engine created through EngineFactory with locales en-US and nl-NL. Any code, operation or controller calls eventbus.broadcast('language-change', ['nl-NL']). setLocale emits change, the adapter broadcasts language-change, setLocale runs again, and so on until RangeError. Language switching through the eventbus is unusable.

**Evidence.**

```ts
locale-manager.ts:186-190
  setLocale(locale: TLanguageCode): void {
    const previousLocale = this._locale;
    this._locale = locale;
    this._rosetta.locale(locale);
    this._emit('change', locale, previousLocale);

types.ts doc: "Emits 'change' event if locale differs from current."

locale-eventbus-adapter.ts:64  this._eventbus.broadcast('language-change', [newLocale]);
locale-eventbus-adapter.ts:83-92  this._onEventbusEvent('language-change', (language) => { ... this._localeManager.setLocale(language);
```

**Fix.** In setLocale, return early if locale === this._locale, before touching rosetta or emitting. This matches the documented contract. Optionally also make the adapter skip setLocale when language === localeManager.locale, for defense in depth. Add an integration test that uses a real Eventbus, LocaleManager and LocaleEventbusAdapter.

Original suggestion: In setLocale, return early when locale === this._locale, as the interface documents. Also add an integration test that broadcasts language-change through the real adapter and manager.

**Verifier.** I traced the loop through the real code and found no guard. LocaleManager.setLocale (locale-manager.ts:185-190) sets the locale and calls _emit('change') unconditionally. _emit (246-256) just iterates handlers. LocaleEventbusAdapter subscribes to 'change' and broadcasts 'language-change' (adapter:60-65). The same adapter also listens for 'language-change' and calls setLocale(language) (adapter:83-92). Its only guard is the availableLocales check, which passes for a valid locale. Eventbus._callHandlers (eventbus.ts:201-225) has no re-entrancy or dedupe guard, and handlers run synchronously. EngineFactory.createEngine connects this adapter (engine-factory.ts:205, 220). So broadcast('language-change', ['nl-NL']) runs the handler, setLocale, change, broadcast, handler, and so on until RangeError. The ILocaleManager doc in types.ts:138 says 'Emits change event if locale differs', which the implementation does not do. The existing tests mock the eventbus (the integration spec only reads the registered handler map), so none exercises the real loop. Severity: a stack overflow on a normal eventbus language switch, which is the documented command path, is serious, but it is limited to the language-change feature and not engine-wide. I rate it high rather than critical.

**Repro test.** `given real Eventbus, LocaleManager (en-US, nl-NL) and connected LocaleEventbusAdapter, when broadcast('language-change', ['nl-NL']) is called, then it does not throw RangeError, localeManager.locale is 'nl-NL' and 'language-change' is broadcast exactly once`

### 4. [high] Engine and EngineEventbusAdapter both handle eventbus commands and broadcast events

[eligius-engine.ts:481](src/eligius-engine.ts#L481) · area: engine-core · reported severity: critical · verifier: sonnet

**Summary.** EligiusEngine.init() registers its own listeners for timeline-play/pause/stop/seek/toggle-request and request-timeline-uri, and also broadcasts timeline-play/pause/stop/seek/seeked/time/firstframe/duration/complete/restart/current-timeline-change directly. EngineFactory.createEngine also connects EngineEventbusAdapter, which subscribes to the same commands and re-broadcasts the same events from the engine emitter. With a factory-created engine, every command runs twice and every event reaches eventbus listeners twice, including timeline-time on every tick and the ActionRegistryEventbusListener that dispatches event actions.

**Failure scenario.** Factory-created engine, init(), start(): a timeline-play listener is called 2 times (confirmed with a probe test). Broadcasting 'timeline-seek-request' [5] runs engine.seek(5) twice concurrently, so _executeSeekActions runs twice and endOperations of active actions can run twice, because TimelineAction only clears _active after end resolves. Event actions bound to timeline-complete fire twice.

**Evidence.**

```ts
eligius-engine.ts:167-168 `this._emitter.emit('start');
    this.eventbus.broadcast('timeline-play', []);` and :535-538 `this._addEventListener('timeline-seek-request', this._seekRequest.bind(this));`; engine-eventbus-adapter.ts:46-47 `this._onEngineEvent('start', () => { this._eventbus.broadcast('timeline-play', []); });` and :116-118 `this._onEventbusEvent('timeline-seek-request', (position: number) => { this._engine.seek(position); });`; engine-factory.ts:233 `engineEventbusAdapter.connect();`
```

**Fix.** Keep one bridge. Remove _addEventbusListeners and the direct eventbus.broadcast calls from EligiusEngine, and let EngineEventbusAdapter own the mapping, including request-* handlers that return values. Add an integration test that counts broadcasts per command.

Original suggestion: Choose one bridge. Delete _addEventbusListeners and all direct eventbus.broadcast calls from EligiusEngine, and let EngineEventbusAdapter own the eventbus mapping. Engine unit tests that assert eventbus.broadcast should then go through the adapter. Add an integration test that counts broadcasts per command.

**Verifier.** Traced the code. EligiusEngine.start() emits 'start' on its emitter and also calls eventbus.broadcast('timeline-play'). EngineEventbusAdapter, connected in EngineFactory.createEngine (engine-factory.ts:217), subscribes to the engine's 'start' event and broadcasts 'timeline-play' again. The same duplication applies to pause, stop, seek and the other events. Engine.init() calls _addEventbusListeners(), which registers timeline-play-request, timeline-seek-request and the other command listeners. The adapter registers its own listeners for the same requests (timeline-play-request, timeline-seek-request and so on). The eventbus has no dedupe, and I found no guard and no test covering the duplication. Both paths are live in the factory-created engine, so every command runs twice and listeners receive each event twice. Severity: event actions firing twice and double concurrent seeks are real, but the engine still runs and the trigger is the default factory path. High is more honest than critical.

**Repro test.** `given a factory-created engine after init, when timeline-play-request is broadcast on the eventbus, then a timeline-play listener is called exactly once`

### 5. [high] Subtitles never show during video playback because positions are fractional

[subtitles-controller.ts:55](src/controllers/subtitles-controller.ts#L55) · area: controllers · reported severity: high · verifier: sonnet

**Summary.** onTimeHandler looks up actionLookup[position] by exact key. The engine broadcasts timeline-time with the raw position: _onTimeHandler is bound with floor = (x: number) => x, and VideoPositionSource emits player.currentTime(). Subtitle start/end keys such as 3 or 4.5 almost never equal values such as 3.0213, so titles are only shown after a seek, through the range-based onSeekedHandler.

**Failure scenario.** Timeline type 'mediaplayer' with VideoPositionSource and a subtitle {start:3,end:5}. During normal playback timeline-time delivers 2.98, 3.02, ... and no key matches, so the subtitle is never displayed. A paused RAF source with tickInterval 1000 hides the problem in tests.

**Evidence.**

```ts
onTimeHandler(position: number) {
    const func = this.actionLookup[position];
    if (func && this.lastFunc !== func) {
```

**Fix.** In onTimeHandler, use a range lookup. Find the duration with start <= position < end. If one is found, run actionLookup[start] when it differs from lastFunc. Otherwise call removeTitle(). Optionally sort the durations in init and keep a moving index. Alternatively, have the engine floor positions to 0.1 s (the documented action precision) in the _onTimeHandler binding. That would also fix exact-key lookup for timeline actions on video sources.

Original suggestion: Use the same range lookup as onSeekedHandler (find the duration with start <= position < end, otherwise removeTitle) and keep lastFunc-based dedup. Ideally sort the durations once in init and use a moving index for O(1) per tick.

**Verifier.** Traced the full path. SubtitlesController.onTimeHandler (subtitles-controller.ts:55) does an exact-key lookup, actionLookup[position]. The keys are the raw titles[i].duration.start and duration.end values (lines 100-105). The controller listens to 'timeline-time'. The engine broadcasts that event from _onTimeHandler (eligius-engine.ts:780-789) with pos = floor(position). It is bound at line 388 with floor = (x) => x, so the position is not quantized. EngineEventbusAdapter (line 59) also forwards the raw 'time' value. VideoPositionSource.timeupdate handler (video-position-source.ts:301-303) calls setPosition(player.currentTime()). BasePositionSource.setPosition (lines 189-196) passes that raw value to the callbacks, so positions like 2.98 or 3.0213 reach the controller and never match key 3. The only quantization is in RafPositionSource (line 151), which floors to tick boundaries, so integer or tick-aligned subtitle times can still match there. The engine's own timeline actions also use exact key lookup (_executeActionsForPosition), but that does not affect the subtitle logic. The seek path (broadcast at lines 230-234) does use the range-based onSeekedHandler, which matches the report that titles only show after a seek. I found no guard, and no test covers fractional positions. SubtitlesController.spec.ts broadcasts only integer positions (0, 5). Scope is limited to non-RAF position sources (video, scroll), and RAF subtitles that sit on tick boundaries work. That is why I rate it medium-high rather than critical. A secondary point: the end key also uses an exact match, so removal fails the same way. Note also that onSeekedHandler uses end >= position, whereas the suggested fix uses a half-open interval. Adopt one convention consistently.

**Repro test.** `given SubtitlesController initialised with a subtitle {start:3,end:5}, when timeline-time is broadcast with fractional positions 2.98 then 3.02, then the subtitle text is set in the container (currently it is not, because actionLookup[3.02] is undefined)`

### 6. [high] breakForEach/continueForEach are no-ops inside a when block

[break-for-each.ts:15](src/operation/break-for-each.ts#L15) · area: operations-a · reported severity: high · verifier: sonnet

**Summary.** Action.executeOperation pushes a fresh child scope for every `when`. That scope only proxies currentIndex, eventbus and operations, not loopIndex, loopLength or loopEndIndex. A break or continue placed inside `when ... endWhen` (the normal way to break conditionally) sees `this.loopIndex === undefined` and does nothing, so the loop carries on. Even if it read the parent scope, jumping to loopEndIndex would skip endWhen, so the when-scope would never be popped and endForEach would pop the wrong scope.

**Failure scenario.** Operations: forEach [1..10], when `$scope.currentItem==3`, breakForEach, endWhen, collect currentItem, endForEach. Expected: items 1,2 are collected, then the loop stops. Actual: breakForEach runs on the when-scope where loopIndex is undefined, so all 10 iterations run. continueForEach inside when behaves the same way.

**Evidence.**

```ts
break-for-each.ts:15-16 `if (this.loopIndex !== undefined && this.loopLength !== undefined) {
    this.newIndex = this.loopEndIndex;` ; continue-for-each.ts:16 same guard; action.ts:94-95 `if (operationInfo.systemName === whenSystemName) {
        scope = this._pushScope(scope);` and _pushScope only defines `currentIndex`, `eventbus`, `operations`, `parent`.
```

**Fix.** In break/continue, find the nearest scope in the `parent` chain that has loopIndex defined and set newIndex and clear the loop state on that scope, not on `this`. In Action, when a newIndex comes from break or continue, pop every scope above the loop scope (for example with a `scopeUnwindTo` marker) before the next executeOperation, so the when-scope is not left on the stack. Because the next executeOperation reads newIndex from the top scope, the loop scope must be the top by then. For continue, jump to the endForEach index so endForEach still advances the iteration. Add an integration test with conditional break and continue inside when/endWhen.

Original suggestion: In break/continue, walk `this.parent` to the nearest scope that has `loopIndex` defined. Have Action pop every scope above the loop scope when it applies a newIndex coming from break or continue (for example via a `scopeUnwindTo` marker). Add an integration test with break and continue inside when.

**Verifier.** I traced the scenario through the real code and found no guard. In action.ts, executeOperation takes `scope` as the top of `_scopeStack`. For a `when` operation it calls `_pushScope(scope)`, so the `when` and every operation up to `endWhen` run with the proxy scope as `this`. `_pushScope` defines only currentIndex, eventbus, operations and parent. forEach stores loopIndex, loopLength, loopStartIndex, loopEndIndex and currentItem as own properties on its own pushed scope, so none of them are visible on the when-scope. breakForEach (break-for-each.ts:15) and continueForEach use the guard `this.loopIndex !== undefined && this.loopLength !== undefined`. Inside a `when` block that guard is false, so both operations return without doing anything. No code walks `this.parent` for loop state. Only `$scope` property resolution in resolve-external-property-chain.ts walks parents, and break/continue don't use it. The existing tests in src/test/integration/for-each-loop.spec.ts cover only an unconditional break or continue placed directly in the loop body. The nested `when` test (line 288) doesn't use break or continue. So no test or invariant covers the conditional case, and conditional break is the normal way to use these operations. The second claim also holds. Even if the operations read the parent scope, setting newIndex to loopEndIndex would skip `endWhen`. The when-scope would then stay on `_scopeStack`, and endForEach (which pops only when newIndex is undefined) would run with the wrong scope. Severity: a documented control-flow operation silently does nothing in its main use case. A valid configuration triggers it with no error and the loop runs to completion. I kept it at high.

**Repro test.** `given forEach over 10 items with a when (currentItem == 3) containing breakForEach, when the action runs, then only items 1 and 2 are collected and the scope stack is back to the root scope (it fails today: all 10 iterations run); likewise a continueForEach inside when must skip the rest of the iteration`

### 7. [high] RAF position not anchored to resume/seek position; next tick overwrites it

[raf-position-source.ts:118](src/timelineproviders/position-sources/raf-position-source.ts#L118) · area: timeline-providers-adapters · reported severity: high · verifier: sonnet

**Summary.** seek() and resume-from-suspend only set _position. _onTick then recomputes position purely from `time - _startTimeOffset` and never adds the position the source resumed or seeked from. Pausing, seeking and resuming are therefore not idempotent and get undone on the next tick.

**Failure scenario.** Play to 10 s, pause for 20 s, resume: the next tick sets position to about 30 (wall-clock time minus the stale offset), skipping 20 s of actions. Seeking to 40 while playing at 5 s: the next tick sets position back to about 6, so the seek is lost, and seek actions for 40 have already run, leaving the DOM inconsistent. After a loop iteration, `_startTimeOffset` keeps the old loop time.

**Evidence.**

```ts
`async seek(position: number): Promise<number> { const clampedPosition = ...; this.setPosition(clampedPosition); return clampedPosition; }`
`protected startTicking(): void { this.setPosition(this.getPosition()); this._abortController = new AbortController(); animationInterval(...) }`
`const newPosition = (ticksElapsed * this._tickInterval) / 1000;` (no base position)
```

**Fix.** Track `_basePosition` and `_anchorTime`. In startTicking() and seek(), set `_basePosition` to the current position. Set `_anchorTime` to undefined so the first tick captures its own `time` as the anchor. Compute `newPosition = _basePosition + floor((time - _anchorTime) / tickInterval) * tickInterval / 1000`. On loop wrap, set `_basePosition = 0` and `_anchorTime = time`. This also fixes the absolute-rAF-timestamp problem, because the anchor is taken from the first tick. Add tests that tick after resume and after seek, with the mocked clock starting at a nonzero absolute time.

Original suggestion: Track `_basePosition` and `_anchorTime`. On startTicking and on seek(), set _basePosition = current position and reset _anchorTime to the next tick's time. Compute newPosition = _basePosition + floor((time - _anchorTime) / interval) * interval / 1000. Add tests that tick after resume and after seek.

**Verifier.** I traced the real code and found no guard. RafPositionSource._onTick (raf-position-source.ts:141-175) computes newPosition only from `time - this._startTimeOffset`. `_startTimeOffset` is written in one place, the loop wrap at line 162. It is never set in startTicking() or seek(), and there is no base position. The base class's suspend() and activate() only change state and call stopTicking()/startTicking(); startTicking() just re-emits getPosition() and starts a new animationInterval. seek() only calls setPosition(). The engine (eligius-engine.ts:224-238) calls seek() and then activate(), which is a no-op while the source is already active. Nothing re-anchors the clock. Tracing the scenarios: (1) Pause at 10 s, resume 20 s later. The new animationInterval runs on the same absolute rAF clock, and the offset is still 0 or the old loop value, so the first tick yields wall-clock time minus the stale offset, about 30 s, not 10. (2) Seeking to 40 while playing: setPosition(40) is overwritten by the next tick, which returns to the clock-derived value, so the seek is lost. (3) After a loop wrap the offset keeps the old loop time. There is a worse related fact. The `time` passed to the callback comes from requestAnimationFrame in animationInterval.ts; it is a timestamp since page load, not elapsed since start. With offset 0, the first tick of a source activated at page time T gives position of about T/1000. The existing unit tests mock animationInterval and feed synthetic 1000, 2000 values. They never tick after resume or seek, so none of them covers this. The 'resume from suspended' test only checks that getPosition() is unchanged immediately after activate. RafPositionSource is the default source (timeline-provider-settings-editor.ts:15, 45), so this is reachable from a normal configuration.

**Repro test.** `given RafPositionSource active at position 10 after suspend, when reactivated and a tick arrives 1000ms after resume at a large absolute time (e.g. 31000), then position is 11 not 31; also given active source, when seek(40) then next tick at +1000ms, then position is 41 not a clock-derived small value`

### 8. [high] EngineEventbusAdapter duplicates engine's own eventbus wiring; play-toggle cancels itself

[engine-eventbus-adapter.ts:137](src/adapters/engine-eventbus-adapter.ts#L137) · area: timeline-providers-adapters · reported severity: high · verifier: sonnet

**Summary.** EligiusEngine._addEventbusListeners already subscribes to timeline-play-request, -pause-request, -stop-request, -seek-request, -play-toggle-request and request-timeline-uri, and the adapter subscribes to the same events. Each command therefore runs twice. Toggle runs the adapter handler first (it is connected in createEngine, before engine.init). That handler calls start(), which sets the state to 'active' synchronously, and then the engine's _toggleplay sees 'active' and pauses.

**Failure scenario.** A stopped engine receives eventbus.broadcast('timeline-play-toggle-request', []). The adapter calls start(), so the state becomes active; the engine handler then calls pause(), so the timeline ends up paused and never plays. A play button wired to toggle does nothing. 'timeline-seek-request' runs two concurrent engine.seek() calls, which execute seek actions twice. 'request-timeline-uri' calls switchTimeline twice: the second call passes the `_currentTimelineUri` guard because the first is still awaiting _cleanUpTimeline, so cleanup, start actions and activation all run twice.

**Evidence.**

```ts
adapter: `this._onEventbusEvent('timeline-play-toggle-request', () => { if (this._engine.playState === 'playing') { this._engine.pause(); } else { this._engine.start(); } });` and `this._onEventbusEvent('timeline-seek-request', (position: number) => { this._engine.seek(position); });`
eligius-engine.ts: `this._addEventListener('timeline-play-toggle-request', this._toggleplay.bind(this));` ... `private async _toggleplay() { if (this._activePositionSource?.state === 'active') { this.pause(); } else { await this.start(); } }`
base-position-source.ts activate: `this._state = 'active'; this.startTicking();` (synchronous before any await)
```

**Fix.** Make one layer own the eventbus commands. The least risky change is to remove the command handlers from the adapter (or from EligiusEngine._addEventbusListeners) and keep the state-query responders in only one place. Add an integration test using EngineFactory, a real Eventbus and a RafPositionSource.

Original suggestion: Choose one owner for eventbus commands. Either remove the command listeners from EligiusEngine._addEventbusListeners (the adapter was introduced to own them), or drop them from the adapter. Add an integration test with a real engine, adapter and Eventbus that asserts a single seek or toggle runs once.

**Verifier.** I traced it through the real code and found no guard. EngineFactory.createEngine calls engineEventbusAdapter.connect() (engine-factory.ts ~217), which registers eventbus handlers for timeline-play-request, -pause-request, -stop-request, -seek-request, -play-toggle-request and request-timeline-uri. EligiusEngine.init() then calls _addEventbusListeners() (eligius-engine.ts 481-540), which registers handlers for the same events. Eventbus.broadcast runs the handlers in registration order, so the adapter's handler runs first. The two layers are not deduplicated anywhere.  Toggle on a stopped engine: the adapter handler sees playState !== 'playing' and calls engine.start(). start() runs synchronously up to `await activeSource.activate()`. BasePositionSource.activate() sets `_state = 'active'` and calls startTicking() before it yields, so the state is already 'active' when control returns to the broadcast loop. The engine's _toggleplay then sees `_activePositionSource.state === 'active'` and calls pause(), which suspends the source. The timeline is left suspended, so a play button wired to toggle does nothing. On a playing engine, the adapter pauses it, the state becomes 'suspended', and _toggleplay then calls start() and resumes it, so pause is also cancelled.  Seek and request-timeline-uri are also handled by both layers, so seek() and switchTimeline() run twice. The existing unit tests (adapter spec and engine spec) test each layer with a mocked engine or no adapter, so none covers the combined wiring. Severity stays high: it affects the standard createEngine path and the core eventbus play-toggle command.

**Repro test.** `given engine created via EngineFactory with adapter connected and init awaited and source inactive, when timeline-play-toggle-request is broadcast once, then the position source state is 'active' and start was invoked exactly once (and seek-request triggers a single seek)`

### 9. [high] switchTimeline to another type activates an uninitialised, unwired source

[eligius-engine.ts:275](src/eligius-engine.ts#L275) · area: lens-performance · reported severity: high · verifier: sonnet

**Summary.** Only the first timeline's position source is ever init()ed and given onPosition/onBoundaryReached/onActivated callbacks, in _initializeTimelineProvider. When switchTimeline swaps to another type's source it just assigns it and calls activate(). It also destroy()s the previous source, which a later switch back reuses.

**Failure scenario.** The configuration has an 'animation' timeline first and a 'mediaplayer' timeline second. Calling switchTimeline('video-timeline') activates a VideoPositionSource that was never init()ed, so it has no player. Even with a player, its positions reach no engine callback, so no timeline actions run, no 'time' or 'timeline-time' events fire, the first-frame handler never fires (and the position>0 seek path never runs), and the end boundary is never reported. Switching back reuses the destroyed RAF source.

**Evidence.**

```ts
`if (this._activePositionSource !== newProviderSettings.positionSource) { this._activePositionSource.destroy(); this._activePositionSource = newProviderSettings.positionSource; ... }` ... `await this._activePositionSource.activate();` and the callbacks are only registered at lines 387-399 inside _initializeTimelineProvider
```

**Fix.** Wire each position source once. Keep a Set of wired sources, and have a helper register onPosition, onBoundaryReached and onActivated and await init() before first activation. Call that helper for the first source in _initializeTimelineProvider and for any new source in switchTimeline. On a switch, deactivate the old source instead of destroying it, and destroy every source only in engine.destroy(). Alternatively, destroy the old source and have the factory recreate it on demand.

Original suggestion: Register the engine callbacks on every provider's position source once, guarding by source identity or ignoring events from non-active sources, and init() each source lazily on first switch. Do not destroy sources on switch; deactivate them and destroy them only in engine.destroy().

**Verifier.** I traced the claim through src/eligius-engine.ts and src/engine-factory.ts, and it holds. EngineFactory.createTimelineProvidersForConfig builds a separate position source instance for each timelineProviderSettings type, so an animation source and a mediaplayer source are different objects. Engine.init() calls _initializeTimelineProvider, which uses only timelines[0].type. It registers onPosition, onBoundaryReached and onActivated, and awaits init(), on that one source only. switchTimeline (lines 272-282) swaps in the new type's source when it differs from the active one. It calls destroy() on the old source and assigns the new one, with no callback registration and no init(). It then calls activate() on the new source (line 322). I found no guard anywhere that registers callbacks or inits other sources. The destroyed source stays in this.timelineProviders, so switching back reuses it, and engine.destroy() calls destroy() on it again (lines 457-460). The existing tests do not cover this. engine-decomposed.spec.ts only asserts that two mock sources are different objects, and eligius-engine.spec.ts switchTimeline tests do not exercise a provider-type change with registered callbacks. The scenario needs a valid config with mixed timeline types (animation plus mediaplayer), which the schema allows. The consequence is that VideoPositionSource never runs doInit and the engine receives no position callbacks, so no timeline actions, time events or firstframe/complete events fire. Any mixed-type switch is affected. Whether a double destroy() throws depends on each source's implementation, which I did not check.

**Repro test.** `given animation first timeline and mediaplayer second timeline with distinct mock position sources, when switchTimeline to the mediaplayer timeline, then the new source has init called and onPosition/onBoundaryReached/onActivated registered, and the old source is not destroyed until engine.destroy`

### 10. [high] timeline-play-toggle-request never changes play state on factory-created engines

[eligius-engine.ts:568](src/eligius-engine.ts#L568) · area: engine-core · reported severity: high · verifier: sonnet

**Summary.** Because of the double registration, the adapter's toggle handler runs first (it is registered at createEngine, before init) and the engine's _toggleplay runs second. The second handler sees the state the first one just set and flips it back.

**Failure scenario.** Engine playing, broadcast 'timeline-play-toggle-request': the adapter pauses, then the engine sees 'suspended' and starts again, so it is still playing. Engine paused, toggle: the adapter's start() sets the state to active synchronously inside BasePositionSource.activate, then the engine pauses, and the adapter's pending start() later emits 'start'/'timeline-play' even though the engine is paused. Probe confirmed: playing->playing and paused->paused.

**Evidence.**

```ts
eligius-engine.ts:568-573 `private async _toggleplay() { if (this._activePositionSource?.state === 'active') { this.pause(); } else { await this.start(); } }`; engine-eventbus-adapter.ts:121-127 `if (this._engine.playState === 'playing') { this._engine.pause(); } else { this._engine.start(); }`
```

**Fix.** Remove the duplicate registration. Either drop the 'timeline-play-toggle-request' handler (and the other duplicated playback handlers) from EligiusEngine._addEventbusListeners and keep them in EngineEventbusAdapter, or drop the adapter's toggle handler. Then add a factory-level test (EngineFactory.createEngine, broadcast toggle) asserting playing becomes paused and paused becomes playing.

Original suggestion: Fixed by removing the duplicate engine listeners (previous finding). Add a factory-level regression test for toggle.

**Verifier.** I traced the full path and found no guard. EngineFactory.createEngine calls engineEventbusAdapter.connect(), which registers a 'timeline-play-toggle-request' handler (engine-eventbus-adapter.ts:127) using playState. EligiusEngine.init() then calls _addEventbusListeners() (eligius-engine.ts:332), which registers a second handler, _toggleplay, at line 505. The Eventbus (_callHandlers, eventbus.ts:201-225) calls handlers synchronously in registration order with no dedupe, so the adapter handler runs first and the engine handler second. BasePositionSource.suspend() and activate() set _state synchronously, because activate sets the state before any await. playState maps 'active' to 'playing' and 'suspended' to 'paused'.  Playing case: the adapter sees 'playing' and calls pause(), so the state becomes 'suspended'. _toggleplay then sees a non-active state and calls start(), which reactivates the source. The result is playing, with spurious 'pause' and 'start' events.  Paused case: the adapter calls start(), which sets the state to 'active' synchronously. _toggleplay then sees 'active' and calls pause(). The result is paused, and the adapter's pending start() continues after its await and emits 'start' and 'timeline-play' even though the engine is paused.  The existing tests in eligius-engine.spec.ts (lines 816-835 and 1554+) register only the engine's handler, because they construct the engine without the adapter. No factory-level test covers this, so nothing catches the double registration. The same duplicate handlers also exist for play, pause, stop and seek, but those are idempotent. Toggle is the only non-idempotent one. Toggle is probably triggered by the space hotkey in EngineInputAdapter, and I did not check that wiring. The bug affects default factory-created engines with a valid configuration, so I kept the severity at high. It could be medium, since play and pause buttons still work.

**Repro test.** `given a factory-created engine (adapter connected) that is playing, when 'timeline-play-toggle-request' is broadcast, then playState is 'paused' and 'timeline-play' is not broadcast again (and given paused, toggle yields 'playing')`

### 11. [high] Actions only fire when the reported position exactly equals a configured key

[eligius-engine.ts:792](src/eligius-engine.ts#L792) · area: engine-core · reported severity: high · verifier: sonnet

**Summary.** Since commit 7139a89b the position callback no longer floors (`(x: number) => x`), and _executeActionsForPosition still does an exact property lookup `actions[position]`. Nothing quantises positions to the documented 0.1s precision. VideoPositionSource reports raw currentTime values, ScrollPositionSource reports a scroll fraction times duration, and KeyboardStepSource accumulates floats, so their positions almost never equal a configured start/end key.

**Failure scenario.** Mediaplayer timeline with action {start: 2, end: 5}: video.js timeupdate reports 1.98, 2.23, 2.48 and so on, so actions['2.23'] is undefined and the action never starts or ends (before 7139a89b, Math.floor made key 2 hit). KeyboardStepSource with stepSize 0.1: 0.1+0.1+0.1 = 0.30000000000000004, so an action at 0.3 never fires.

**Evidence.**

```ts
this._activePositionSource.onPosition(
      this._onTimeHandler.bind(this, (x: number) => x)
    );
...
      const executions = actions[position];
      executions?.forEach(exec => exec());
```

**Fix.** Replace the exact-key lookup with interval processing between `_lastPosition` and the new position. Run every action whose key lies in (last, current], in order, and handle backward jumps through the seek path. A cheaper stopgap is to quantise in `_onTimeHandler` with `Math.round(position*10)/10`. That fixes the keyboard float drift, but video still skips keys at 250ms timeupdate granularity, so interval processing is the real fix.

Original suggestion: Quantise in _onTimeHandler (for example Math.round(position * 10) / 10, or to the source's tick precision). Better, replace the exact-key lookup with interval processing between the last and current position (next finding). Add tests that drive the engine with non-tick-aligned positions.

**Verifier.** I traced the whole path and found no guard.  - eligius-engine.ts:387 registers `_onTimeHandler.bind(this, x => x)`, so the position passes through unchanged. Commit 7139a89b changed this from `Math.floor`. - `_onTimeHandler` (line 780) calls `_executeActionsForPosition(pos)`. That does `actions[position]`, an exact property lookup (line 797). - The lookup keys are the raw `duration.start` and `duration.end` numbers (`_initializeTimelinePosition`, lines 680-687). Nothing quantises either the keys or the incoming position. - `VideoPositionSource._handleTimeUpdate` (line 303) calls `setPosition(player.currentTime())` with the raw value. - `ScrollPositionSource._handleScroll` (line 175) calls `setPosition(_calculatePosition())`, a fraction times duration, also unquantised. - `KeyboardStepSource._handleStepForward` (line 317) sets `currentPosition + stepSize`, so floats accumulate. - `BasePositionSource.setPosition` (line 189) forwards the value to callbacks as is. - Only `RafPositionSource` quantises (`ticksElapsed * tickInterval / 1000`, line 152), so it is the one source that works. Its positions land on tick-aligned values that match keys such as 0.3. - A grep for non-aligned positions such as 1.98, 2.23 and 0.30000 in src/test found nothing, so no test covers the case. - Net effect for video, scroll and keyboard sources: a start/end action fires only if the reported position equals a configured key exactly. Video timeupdate values like 1.98 or 2.23 will not hit key 2 or 5, and 0.1+0.1+0.1 gives 0.30000000000000004, which will not hit 0.3. - Seeks are unaffected, because `_executeSeekActions` uses range comparison. - The `_lastPosition !== pos` check does not help. It only suppresses duplicate positions. - Severity: high for non-RAF timelines, because actions silently never fire. RAF timelines are unaffected.

### 12. [high] Factory destroy() disconnects adapters before end ops run, breaking selectElement

[engine-factory.ts:228](src/engine-factory.ts#L228) · area: lens-lifecycle-memory · reported severity: high · verifier: sonnet

**Summary.** The destroy closure disconnects EngineEventbusAdapter before engineInstance.destroy() runs the end operations of active timeline actions and init actions. Only that adapter registers the onRequest responder for 'request-engine-root', which selectElement needs. Every end-operation chain that starts with selectElement therefore gets no selectedElement. The next operation (removeElement, removeClass, removeControllerFromElement) throws, and engine.destroy() rejects before it removes its eventbus listeners or destroys the position sources.

**Failure scenario.** Use the config from integration/end-in-correct-order.spec.ts: an init action whose endOperations are selectElement then removeElement. Call `const r = factory.createEngine(cfg); await r.engine.init(); await r.destroy();`. selectElement gets undefined from request('request-engine-root'), so selectedElement is undefined and removeElement throws 'Cannot read properties of undefined (reading remove)'. destroy() rejects, the RAF position source is never destroyed and keeps ticking, and the engine's eventbus handlers stay registered.

**Evidence.**

```ts
engine-factory.ts:
        engineInputAdapter.disconnect();
        localeEventbusAdapter.disconnect();
        engineEventbusAdapter.disconnect();
        // Destroy engine (which also destroys localeManager internally)
        await engineInstance.destroy();

select-element.ts:70:
  const root = this.eventbus.request<JQuery>('request-engine-root');
  if (root) {
    operationData.selectedElement = findElementBySelector(root, selector);
  }

engine-eventbus-adapter.ts:156:
    this._registerRequest('request-engine-root', () => {
      return this._engine.engineRoot;
    });
```

**Fix.** In the factory destroy closure, run await engineInstance.destroy() first, then disconnect engineInputAdapter, localeEventbusAdapter and engineEventbusAdapter, inside a try/finally so the adapters are disconnected even if destroy rejects. Also wrap _cleanUp() in try/finally in EligiusEngine.destroy() so the remover and position-source teardown always runs. Consider disconnecting only engineInputAdapter up front, to stop new external input.

Original suggestion: In the destroy closure, await engineInstance.destroy() first and disconnect the adapters afterwards, or at least keep EngineEventbusAdapter connected until destroy() finishes. Also wrap _cleanUp in try/finally inside EligiusEngine.destroy so removers and source destruction always run.

**Verifier.** Traced the real code. The factory destroy closure (engine-factory.ts 226-236) calls engineEventbusAdapter.disconnect() before engineInstance.destroy(). disconnect() removes every remover in _eventbusRemovers, and those include the onRequest responder for 'request-engine-root' (registered via _registerRequest, engine-eventbus-adapter.ts:156). The engine registers its own 'request-engine-root' handler (eligius-engine.ts:483), but through eventbus.on, which is the callback style (broadcast with a resultCallback). Eventbus.request() only consults requestResponders, so that handler is never reached and no other responder exists. After disconnect, request('request-engine-root') returns undefined. selectElement (select-element.ts:70) then skips setting selectedElement. removeElement does selectedElement.remove() and throws a TypeError. EndableAction.end rethrows the error, and _executeActions awaits it without a catch. EligiusEngine.destroy() calls _cleanUp() first, with no try/finally. A rejection there skips localeManager.destroy, the eventbus remover loop, positionSource.destroy and the container empty. Existing tests (end-in-correct-order.spec.ts:84, engine-smoke) call engine.destroy() directly on the engine, not the factory's destroy(), so none covers this path. No guard or invariant prevents it. Any valid config with active timeline actions or init actions whose end operations begin with selectElement hits it, and that pattern is common. Factory destroy() is the documented teardown API in CLAUDE.md.

**Repro test.** `given a config whose init action has endOperations [selectElement, removeElement], when factory.createEngine(cfg) is initialised and the returned destroy() is awaited, then destroy resolves, the selected element is removed and the position source is destroyed (today it rejects with 'Cannot read properties of undefined (reading remove)')`

### 13. [high] Engine and EngineEventbusAdapter both handle the same commands; play-toggle never toggles

[eligius-engine.ts:505](src/eligius-engine.ts#L505) · area: lens-lifecycle-memory · reported severity: high · verifier: sonnet

**Summary.** EligiusEngine._addEventbusListeners subscribes to timeline-play-toggle-request, play/pause/stop/seek-request and request-timeline-uri. EngineEventbusAdapter, which createEngine always connects, subscribes to the same events and calls the same engine methods. The engine also broadcasts 'timeline-play', 'timeline-time', 'timeline-firstframe' and the other state events directly, while the adapter re-broadcasts the same emitter events. Every command therefore runs twice, and every state event (including 'timeline-time' on each tick) is broadcast twice.

**Failure scenario.** The engine is paused and something broadcasts 'timeline-play-toggle-request'. The adapter handler, registered first in createEngine, calls start(). BasePositionSource.activate sets state='active' synchronously, so the engine's own _toggleplay handler then sees 'active' and calls pause(). The net state stays paused, with start and pause events both emitted. Likewise 'request-timeline-uri' calls switchTimeline twice concurrently. Both calls pass the _currentTimelineUri guard because the URI only changes after `await _cleanUpTimeline()`, so active actions get end() twice and start actions can run twice. On every tick, 'timeline-time' handlers such as SubtitlesController, ProgressbarController and event actions on timeline-time run twice.

**Evidence.**

```ts
eligius-engine.ts:
    this._addEventListener(
      'timeline-play-toggle-request',
      this._toggleplay.bind(this)
    );
...
  private async _toggleplay() {
    if (this._activePositionSource?.state === 'active') {
      this.pause();
    } else {
      await this.start();
    }
  }
...
        this._executeActionsForPosition(pos);
        this._emitter.emit('time', pos);
        this.eventbus.broadcast('timeline-time', [pos]);

engine-eventbus-adapter.ts:
    this._onEventbusEvent('timeline-play-toggle-request', () => {
      if (this._engine.playState === 'playing') {
        this._engine.pause();
      } else {
        this._engine.start();
      }
    });
...
    this._onEngineEvent('time', (position: number) => {
      this._eventbus.broadcast('timeline-time', [position]);
    });
```

**Fix.** Make the adapter the single owner of command handling and state-event broadcasting. In EligiusEngine, remove the subscriptions for timeline-play/pause/stop/seek/play-toggle-request and request-timeline-uri from _addEventbusListeners. Also remove the direct eventbus.broadcast calls that duplicate emitter events (timeline-play/pause/stop/time/seek/seeked/duration/complete/firstframe/restart/current-timeline-change). Keep the request/callback handlers the adapter does not cover. Alternatively, keep the engine's handlers and drop the adapter's duplicates, but pick one. Add an EngineFactory integration test that counts handler calls.

Original suggestion: Pick one owner. Since the adapter exists for this purpose, delete the engine's command subscriptions in _addEventbusListeners and its direct eventbus.broadcast calls, and rely on the emitter plus adapter (keeping only the callback-style request handlers the adapter does not cover). Add an integration test that goes through EngineFactory and counts broadcasts and handler calls.

**Verifier.** I traced the code and found no guard. EngineFactory.createEngine always builds an EngineEventbusAdapter and calls connect(). That adapter subscribes to timeline-play/pause/stop/seek/play-toggle-request and request-timeline-uri. EligiusEngine.init() calls _addEventbusListeners(), which subscribes to the same events and calls the same engine methods. Eventbus.broadcast calls every handler with no dedup, and the adapter connects before init, so its handlers run first.  The engine also broadcasts directly. start() does emit('start') and then broadcast('timeline-play'). pause() and stop() do the same, and so does the tick path (line 787: emit('time') then broadcast('timeline-time')). The adapter re-broadcasts each emitter event, so these state events are published twice. 'timeline-time' fires twice per tick.  Toggle: with the engine paused, the adapter handler sees playState !== 'playing' and calls start(). start() is async, but its synchronous prefix runs BasePositionSource.activate, which sets _state='active' before the first await. The engine's _toggleplay then sees state 'active' and calls pause(). The net result is paused, with start and pause both emitted. A toggle from playing does the reverse: the adapter pauses, then the engine sees a non-active state and starts, so it also ends playing. Toggle therefore never changes the state.  request-timeline-uri: the adapter calls switchTimeline and the engine's _handleRequestTimelineUri calls it too. Both calls are concurrent, which supports the double-execution claim. I did not verify the _currentTimelineUri guard timing in detail.  This is reachable from a valid configuration, because every createEngine user gets both. play-request, pause-request and seek-request are mostly idempotent, but the doubled broadcasts and the broken toggle are real. Severity stays high. I did not find an existing test going through EngineFactory that covers this; only the adapter unit spec exists.

**Repro test.** `given engine created via EngineFactory and paused, when timeline-play-toggle-request is broadcast once, then playState is playing and exactly one timeline-play and zero timeline-pause events were broadcast (fails today: start and pause both fire and it ends paused); also given a running timeline, when one tick occurs, then timeline-time handlers are called exactly once`

### 14. [medium] setData allows prototype pollution via __proto__/constructor in target chain

[set-data.ts:66](src/operation/set-data.ts#L66) · area: lens-security-robustness · reported severity: critical · verifier: sonnet

**Summary.** setData splits the target key on '.', resolves every segment except the last with getPropertyChainValue (which has no forbidden-key guard), then assigns to the result. A key like '$operationdata.__proto__.polluted' resolves to Object.prototype and writes to it.

**Failure scenario.** Configuration operation {systemName:'setData', operationData:{properties:{'$operationdata.__proto__.polluted':'yes'}}} -> afterwards ({}).polluted === 'yes' for every object in the page (verified with a temporary vitest spec). '$globaldata.constructor.prototype.x' works the same way.

**Evidence.**

```ts
const propertyTarget = getPropertyChainValue(
      path,
      (targets as any)[rootTarget]
    ) as Record<string, any>;

    propertyTarget[property] = propertyValue;
```

**Fix.** Add a shared guard that rejects '__proto__', 'constructor' and 'prototype' segments. Apply it in getPropertyChainValue (every hop), so resolvePropertyChain and the other callers are covered too, and in setData before `propertyTarget[property] = ...`. Also require Object.hasOwn on the write target. Throw an error naming the operation and the offending chain.

Original suggestion: In getPropertyChainValue, reject the segments '__proto__', 'constructor' and 'prototype', and require Object.hasOwn for every hop (or at least for the write target). Throw an error that names the operation and the offending chain. Add the same check in setData before assigning `property`.

**Verifier.** I traced the code and the failure holds. In src/operation/set-data.ts, the key '$operationdata.__proto__.polluted' splits into root 'operationdata', property 'polluted' and path ['__proto__']. getPropertyChainValue (src/operation/helper/get-property-chain-value.ts) only checks that each hop is truthy and then returns currentInstance[prop]. It has no own-property or forbidden-key check, so the chain returns operationData.__proto__, which is Object.prototype. The write `propertyTarget['polluted'] = value` then sets it on Object.prototype. '$globaldata.constructor.prototype.x' resolves the same way: constructor is Object, and its prototype is Object.prototype. A grep of src/ for __proto__ and pollution finds no guard and no test covering this, and CLAUDE.md explicitly requires a guard against prototype pollution when resolving property chains. I did not run the repro. Severity is lower than claimed because the key comes from the configuration author, who already controls the operations and so already has the page's trust. It becomes serious only when configurations are loaded from untrusted sources, such as a user-supplied or remote JSON file. It is a real hardening gap that violates the project's own security rule, so I rate it medium.

**Repro test.** `given setData with properties {'$operationdata.__proto__.polluted': 'yes'}, when the operation runs, then it throws and ({} as any).polluted is undefined (fails today because Object.prototype.polluted === 'yes')`

### 15. [medium] Lottie detach never destroys immediately; endPosition is always set from timeCompleted

[lottie-controller.ts:125](src/controllers/lottie-controller.ts#L125) · area: controllers · reported severity: high · verifier: sonnet

**Summary.** _createAnimation sets endPosition = animationItem.timeCompleted whenever no end= was given in the URL, so in detach `endPosition > -1` is always true. Detach therefore always plays the segment [freezePosition, endPosition] (with freezePosition -1 when unset) and waits for 'complete'. A looping animation never completes, so it is never destroyed. The test 'should destroy animation item when no endPosition set' hides this by forcing controller.endPosition = -1.

**Failure scenario.** Config with url 'anim.json' (no [freeze,end]) and loop:true -> removeControllerFromElement -> detach calls playSegments([-1, timeCompleted]). 'complete' never fires on a looping animation, so the AnimationItem and its DOM and RAF work leak for the lifetime of the page.

**Evidence.**

```ts
if (this.endPosition < 0) {
      this.endPosition = this.animationItem.timeCompleted;
    }
...
      if (this.endPosition > -1) {
        this.animationItem.addEventListener(
          'complete',
          this._destroy.bind(this)
        );
        this.animationItem.playSegments(
          [this.freezePosition, this.endPosition],
          true
        );
```

**Fix.** Do not overwrite the URL-parsed end position. Keep a separate field such as _urlEndPosition, and take the play-out path in detach only when the URL configured an end (and a freeze). Otherwise call animationItem.destroy() and set animationItem = null. Also remove the duplicate _createAnimation() call in attach. Fix the test to leave endPosition alone, and add a test for loop:true with a URL that has no parameters.

Original suggestion: Keep the URL-parsed end position in its own field (e.g. this._urlEndPosition) and only take the play-out path when both freeze and end were configured. Otherwise destroy immediately and null animationItem. Fix the test so it does not override endPosition.

**Verifier.** I traced lottie-controller.ts and found no guard. endPosition starts at -1 and is only changed by _parseFilename (when the URL has end=) or at line 177. In _createAnimation, `if (this.endPosition < 0) this.endPosition = this.animationItem.timeCompleted;` runs on every attach. With inline animationData, lottie-web sets timeCompleted to totalFrames, which is positive. The spec mock uses timeCompleted: 100. So after attach, endPosition > -1 holds even for a URL like 'anim.json' with no bracket parameters. Nothing else resets it.  The two other inputs to detach are: - Detach therefore takes the play-out branch: it registers a 'complete' listener and calls playSegments([freezePosition (-1 if unset), endPosition], true). - A loop:true animation never fires 'complete', so _destroy never runs. animationItem stays alive with its DOM and RAF work. Immediate destroy is therefore unreachable via the else branch for any attached controller unless a test overwrites the field.  The existing test 'should destroy animation item when no endPosition set' (spec lines 256-281) only passes because it sets `controller.endPosition = -1` by hand after attach (line 274). The comment there admits this. No test covers the real URL-without-end case.  Mitigating points that keep this from being high: - Non-looping animations still complete and get destroyed, just after playing out a segment. This may even be the intended design for non-looping animations. - The leak needs loop:true plus a detach. - Detach also leaves the 'complete' listener unremoved, and it is added again on every detach.  Related smaller defect: attach() calls _createAnimation() twice (lines 117-118), which creates and destroys an animation needlessly.

**Repro test.** `given a LottieController initialised with url 'animation.json' (no [freeze,end]) and loop true, when attach then detach are called, then animationItem.destroy is called immediately and playSegments is not called (currently fails because endPosition becomes timeCompleted=100)`

### 16. [medium] Lottie label localisation crashes on non-empty data and has no provider

[lottie-controller.ts:195](src/controllers/lottie-controller.ts#L195) · area: controllers · reported severity: high · verifier: sonnet

**Summary.** _createTextDataLookup writes into this.labelData[labelId][code] without ever creating this.labelData[labelId], so any non-empty collection throws a TypeError. In production nothing registers onRequest('request-label-collections'); the only references are this controller, the event type and tests. The request therefore returns undefined, and !!labelId!! placeholders are never replaced. The tests dodge the crash with 'controller.labelData = {label1: {}}' ('Pre-initialize labelData structure') and never assert the replaced text. The labels array was removed in 2.2.0 but this path was never ported to the rosetta locale manager.

**Failure scenario.** LottieController with labelIds:['title'] and an app that answers request-label-collections with [[{code:'en-US',label:'Hi'}]] -> TypeError 'Cannot set properties of undefined' during attach. With the stock engine (no handler) the animation renders the literal '!!title!!' text in every language.

**Evidence.**

```ts
this.labelData[this.operationData.labelIds[index]][d.code] = d.label;
...
      const labelCollections =
        eventbus.request<any[]>(
          'request-label-collections',
          this.operationData.labelIds
        ) ?? [];
```

**Fix.** Use `(this.labelData[id] ??= {})[d.code] = d.label` in `_createTextDataLookup`. Better, resolve each labelId through `request-translation` (the rosetta path LabelController uses) and drop or deprecate `request-label-collections`. Also remove the duplicate `_createAnimation()` call in `attach`, and add a test that asserts the replaced text in the animationData passed to `loadAnimation`, without pre-seeding `labelData`.

Original suggestion: Resolve each labelId through 'request-translation' (the rosetta path LabelController uses) when building the serialized data, or initialise labelData[labelId] ??= {}. Either register a provider for request-label-collections or deprecate the event. Add a test that asserts the text in the animationData passed to loadAnimation.

**Verifier.** I traced the code and the claim holds. In src/controllers/lottie-controller.ts, `labelData` starts as `{}`. `_createTextDataLookup` (line 195) assigns `this.labelData[labelId][d.code] = d.label` and never creates `labelData[labelId]`. Any non-empty collection therefore throws "Cannot set properties of undefined" inside `attach`. No guard or invariant elsewhere creates those keys. The existing tests only avoid the crash by pre-seeding `controller.labelData = {label1: {}}`. They never assert the replaced text, and several of them use mock payloads that the controller doesn't read, such as `languageCode` instead of `code`, or the `broadcast` mock.  A grep of src finds no `onRequest('request-label-collections')` outside tests, so the stock engine registers no provider. `Eventbus.request` then returns undefined, which becomes `[]` through `?? []`. In that case nothing crashes and `!!id!!` placeholders stay literal. That matches the report's second claim.  Limits on severity: the crash needs an application to register its own handler for a public event. A valid configuration on the stock engine cannot trigger it. The stock-engine symptom is only that localisation is silently missing, because the feature was never ported to rosetta. This is a real defect and dead or half-ported functionality, but I rate it medium rather than high. A separate small flaw is that `attach` calls `_createAnimation()` twice (lines 117-118).

**Repro test.** `given a request-label-collections responder returning [[{code:'en-US',label:'Hi'}]] and labelIds ['title'] with no pre-seeded labelData, when attach is called, then it does not throw and loadAnimation receives animationData with '!!title!!' replaced by 'Hi'`

### 17. [medium] customFunction crashes when the custom function returns a non-promise value

[custom-function.ts:39](src/operation/custom-function.ts#L39) · area: operations-a · reported severity: high · verifier: sonnet

**Summary.** Any truthy return value is treated as a promise and `.then` is called on it. A custom function written as an ordinary synchronous TOperation (returning operationData) throws TypeError inside the Promise executor, so the action rejects. The function's return value, sync or async, is also thrown away rather than merged.

**Failure scenario.** Register customFunctions `{double: function(d){ d.x = d.x*2; return d; }}`. The operation customFunction {systemName:'double'} throws `promise.then is not a function`, and the action start rejects with 'Error in action start'.

**Evidence.**

```ts
const promise = func.apply(this, [operationData]);
  if (promise) {
    return new Promise<ICustomFunctionOperationData>((resolve, reject) => {
      promise.then(() => {
        internalResolve(resolve, {}, operationData);
      }, reject);
```

**Fix.** Guard the Promise branch with isPromise(result) (or a check that typeof result?.then === 'function'). For a non-promise return, return operationData. Optionally merge the result when it is an object, but that is a behaviour change. Add a spec for a synchronous function that returns data. The audit's suggestion to merge results is optional, because the current code deliberately ignores the resolved value.

Original suggestion: Use isPromise(result). For a promise, `result.then(r => internalResolve(resolve, operationData, r))`. Otherwise return `isObject(result) ? mergeOperationData(operationData, result) : operationData`. Add a spec for a synchronous function that returns data.

**Verifier.** I traced src/operation/custom-function.ts lines 39-46. The only guard is `if (promise)`, a truthiness check. No isPromise or thenable check exists there, and no wrapper elsewhere normalises the function's return. The `request-function` handler in engine-factory.ts hands back the registered function as-is. A synchronous custom function that returns an object (for example `function(d){ d.x*=2; return d; }`) therefore takes the Promise branch. `promise.then` is undefined, so calling it throws a TypeError inside the Promise executor. The returned promise rejects, and the action fails. I found no guard, invariant or documentation that makes this unreachable or intended. The existing spec (src/test/unit/operation/custom-function.spec.ts) only covers functions that return undefined or a real Promise, so nothing covers this case. Two details soften the claim. Returning operationData from a TOperation-typed function is a reasonable thing for a user to do, but the operation's documented contract is only "invokes it with the current operation data", so discarding the return value looks like a deliberate design choice. The real defect is the missing thenable check. It also needs a user-supplied sync function that returns something truthy, and it fails loudly rather than corrupting state. That makes it medium severity, not high.

**Repro test.** `given a custom function that synchronously returns its operationData object, when customFunction is applied, then it resolves with the operation data (systemName removed) instead of rejecting with 'promise.then is not a function'`

### 18. [medium] resolvePropertyValues writes nested resolutions into source, not the returned copy

[resolve-property-values.ts:63](src/operation/helper/resolve-property-values.ts#L63) · area: lens-security-robustness · reported severity: high · verifier: sonnet

**Summary.** When newProperties !== operationData (setOperationData, setStyle), copy is a deep clone. Nested objects and arrays are then resolved in place on the original `properties` (value/arr), while the returned copy keeps the unresolved '$operationdata.*' strings.

**Failure scenario.** setOperationData {x:5, properties:{nested:{a:'$operationdata.x'}, arr:['$operationdata.x']}} returns {x:5, nested:{a:'$operationdata.x'}, arr:['$operationdata.x']}, so neither value is resolved (verified).

**Evidence.**

```ts
} else if (Array.isArray(value)) {
        value.forEach((item, index, arr) => {
          if (isExternalProperty(item)) {
            arr[index] = resolvePropertyChain(item);
          } else if (isObject(item)) {
            resolveNewProperties(item, item, resolvePropertyChain);
...
      } else if (isObject(value)) {
        resolveNewProperties(value, value, resolvePropertyChain);
```

**Fix.** Pass the matching copy node when recursing: resolveNewProperties(value, copy[key], ...) for objects. For arrays, write copy[key][index] = resolvePropertyChain(item) and recurse with (item, copy[key][index]). Do not mutate the source arrays. Add specs for nested object and array resolution through setOperationData and resolvePropertyValues, and assert the input is not mutated.

Original suggestion: Recurse with (value, copy[key]) and (item, copy[key][index]), and write arrays as copy[key][index] = ...; or skip the separate deepCopy and build the resolved structure while walking. Add a spec for nested object and array resolution through setOperationData.

**Verifier.** Traced the code in resolve-property-values.ts. When newProperties !== operationData (setOperationData passes `properties`, a distinct object), copy = structuredClone(newProperties). resolveNewProperties(newProperties, copy, ...) then walks the ORIGINAL. Top-level external strings and primitives are written to copy[key], so flat values work. For an array value, it assigns arr[index] on the original array. For a nested object value or array item, it calls resolveNewProperties(value, value, ...) or (item, item, ...), so the copy argument is the source itself. The cloned copy[key] is never visited and keeps the raw '$operationdata.*' strings. The function returns copy, so nested objects and arrays come back unresolved, and the caller's input gets mutated. setOperationData spreads the returned resolvedProperties, which confirms this. I found no guard, invariant or documented intent. The existing spec has only four flat-property tests and none cover nesting. The setOperationData call path is reachable from a valid configuration. I could not run the temp spec because vitest reported no test files for the filter, so this is traced by reading, not executed. When newProperties === operationData (calc, math and probably create-element), copy is the source, so those paths work. The damage is limited to nested resolution via setOperationData and setStyle, so the impact is medium rather than high.

**Repro test.** `given setOperationData properties with a nested object and an array containing '$operationdata.x', when resolvePropertyValues is called with a distinct newProperties object, then the returned copy has nested.a and arr[0] resolved to the operation data value and the input properties are unchanged`

### 19. [medium] when() never strips quotes from string literals, so string comparisons always fail

[when.ts:59](src/operation/when.ts#L59) · area: lens-security-robustness · reported severity: high · verifier: sonnet

**Summary.** TValue explicitly allows `'${string}'` literals, but parseExpression passes the raw token, quotes included, to resolveExternalPropertyChain, which returns non-chain strings unchanged. A resolved value is therefore compared against "'John'" rather than 'John'. Whitespace around operators is not trimmed either, so '$operationdata.x == 1' looks up the key 'x '.

**Failure scenario.** when {name:'John', expression:"$operationdata.name=='John'"} -> whenEvaluation === false (verified); the then-branch is skipped.

**Evidence.**

```ts
type TValue =
  | `'${string}'`
...
    (Number.isNaN(rightNr)
      ? resolveExternalPropertyChain(
          operationData,
          operationScope,
          right as ExternalProperty
        )
      : rightNr) as TValue,
```

**Fix.** In parseExpression, trim left and right. Add a helper that returns the inner string when a token matches /^'(.*)'$/, and use it for both sides before the parseFloat and resolveExternalPropertyChain path. If the split yields no right operand, throw new Error("when: invalid expression '...'"). Add specs for quoted literals, whitespace around operators and a missing operator.

Original suggestion: Trim left and right. If a token matches /^'(.*)'$/, use the inner string. Throw a 'when: invalid expression' error when no operator is found (right is currently undefined there, and right.length throws a TypeError).

**Verifier.** Traced src/operation/when.ts. parseExpression splits on /!=|==|>=|<=|>|</ with no trim and no quote handling. For "$operationdata.name=='John'" it gives left="$operationdata.name" and right="'John'". parseFloat("'John'") is NaN, so right goes to resolveExternalPropertyChain. That function only resolves strings starting with $operationdata., $globaldata. or $scope.; anything else is returned unchanged, quotes included. The left resolves to 'John', so 'John' === "'John'" is false. TValue and the JSDoc ('constant': for a constant string, and the example $scope.variables.foo=='bar') both document quoted literals, so this is intended behaviour that does not work. when does not pre-resolve its expression, and nothing upstream strips quotes. A grep of src/test found no test using a quoted literal; every when.spec.ts case uses numbers or two data references, so nothing covers this. The whitespace claim also holds: '$operationdata.x == 1' leaves left='$operationdata.x ' and looks up key 'x ', which gives undefined or throws. The missing-operator TypeError also holds, since right is undefined and right.length throws. Severity is medium, not high. Comparing against a string constant is the main use of when and fails silently, but a workaround exists (compare against a data reference) and numeric and reference comparisons work.

**Repro test.** `given operationData {name:'John'} and expression "$operationdata.name=='John'", when the when operation is applied, then whenEvaluation is true and newIndex stays undefined`

### 20. [medium] setData allows prototype pollution via __proto__/constructor path segments

[set-data.ts:84](src/operation/set-data.ts#L84) · area: operations-b · reported severity: high · verifier: sonnet

**Summary.** setData resolves the target object with getPropertyChainValue and then assigns into it, with no guard on __proto__, constructor or prototype segments. A configuration key like '$globaldata.__proto__.polluted' writes to Object.prototype. CLAUDE.md requires a guard against exactly this.

**Failure scenario.** setData with properties {'$globaldata.__proto__.polluted': 'yes'} -> ({}).polluted === 'yes' for every object in the page (confirmed in a vitest probe). '$operationdata.constructor.prototype.x' does the same.

**Evidence.**

```ts
const propertyTarget = getPropertyChainValue(
      path,
      (targets as any)[rootTarget]
    ) as Record<string, any>;

    propertyTarget[property] = propertyValue;
```

**Fix.** Add a shared helper that rejects the segments '__proto__', 'prototype' and 'constructor'. Call it on every segment in getPropertyChainValue, and also on the final `property` in setData. Throw an error that names the operation and the offending chain. Add specs for each segment in set-data.spec.ts and in the property-chain helper spec.

Original suggestion: Reject the segments '__proto__', 'prototype' and 'constructor' in getPropertyChainValue and in setData's final `property`, and throw an error naming the offending chain. Add specs for each segment.

**Verifier.** I traced the code and found no guard. In src/operation/set-data.ts, resolveTargets splits the key on '.'. For '$globaldata.__proto__.polluted', rootTarget is 'globaldata', property is 'polluted' and path is ['__proto__']. getGlobals() with no name returns the live cache object. getPropertyChainValue (src/operation/helper/get-property-chain-value.ts) just reduces with currentInstance[prop], so cache['__proto__'] returns Object.prototype. The code then runs propertyTarget['polluted'] = value, which writes to Object.prototype. A grep for __proto__, prototype and constructor in src/operation/helper found nothing, so no guard exists there. '$operationdata.constructor.prototype.x' follows the same path. The only spec for set-data is src/test/unit/operation/set-data.spec.ts, and I did not see it cover this. The behaviour is not documented as intended, and CLAUDE.md explicitly requires a guard against prototype pollution. The main mitigation is that the configuration author controls the keys, so it is not triggered by end users unless configurations are loaded from untrusted sources. That lowers the severity from high to medium. The same unguarded traversal also affects every other caller of getPropertyChainValue, for example reads of arbitrary properties such as constructor.

**Repro test.** `given setData with properties {'$globaldata.__proto__.polluted': 'yes'}, when the operation runs, then it throws and ({} as any).polluted is undefined`

### 21. [medium] resolvePropertyValues resolves nested values on the source, returns them unresolved

[resolve-property-values.ts:58](src/operation/helper/resolve-property-values.ts#L58) · area: operations-b · reported severity: high · verifier: sonnet

**Summary.** For array and object values, resolution writes into `value`, which belongs to the original `properties`, not into `copy`. The deep-copied result therefore keeps the raw '$operationdata...' strings for anything nested, while the caller's input object is mutated. setOperationData and setStyle return unresolved nested values.

**Failure scenario.** resolvePropertyValues({name:'x'}, scope, {nested:{a:'$operationdata.name'}, arr:['$operationdata.name']}) returns {nested:{a:'$operationdata.name'}, arr:['$operationdata.name']} and mutates the input to {nested:{a:'x'}, arr:['x']} (confirmed). So setOperationData {properties:{list:['$operationdata.x']}} passes the literal string downstream.

**Evidence.**

```ts
} else if (Array.isArray(value)) {
        value.forEach((item, index, arr) => {
          if (isExternalProperty(item)) {
            arr[index] = resolvePropertyChain(item);
          ...
      } else if (isObject(value)) {
        resolveNewProperties(value, value, resolvePropertyChain);
```

**Fix.** Make resolveNewProperties recurse with matching nodes. For arrays, iterate value and write the resolved item into copy[key][index], and recurse into objects with (item, copy[key][index]). For nested objects, call resolveNewProperties(value, copy[key], ...). Leave `properties` unmutated. When copy === properties (calc, math, createElement), this still works because the nodes are identical.

Original suggestion: Recurse with the matching copy node: resolveNewProperties(value, copy[key], ...), and write array items into copy[key][index]. Add nested object and array specs, including one asserting the input is not mutated.

**Verifier.** I ran the failure scenario through the real code. resolvePropertyValues({name:'x'}, defaultScope, {nested:{a:'$operationdata.name'}, arr:['$operationdata.name']}) returned {"nested":{"a":"$operationdata.name"},"arr":["$operationdata.name"]}. The input object was mutated to {"nested":{"a":"x"},"arr":["x"]}. In resolve-property-values.ts, only top-level external properties and primitives are written to `copy`. Arrays and nested objects are resolved in place on the source, and the structuredClone copy is returned with the raw strings. The nested case is also hit when newProperties === operationData (calc, math, createElement), because copy and source are then the same object and in-place mutation is correct there. The affected callers are setOperationData and setStyle, which pass a separate `properties` object, and no existing spec covers nested values. It is reachable from valid configurations, but only for nested array or object values inside setOperationData or setStyle properties. That is a real functional bug, though a narrow one, so I rate it medium rather than high. A second effect is that the shared configuration object is mutated, so the first execution resolves it and later ones see stale values.

**Repro test.** `given setOperationData-style properties with a nested object and an array holding '$operationdata.name' strings, when resolvePropertyValues is called with a separate properties object, then the returned copy has the resolved values and the input properties object is not mutated`

### 22. [medium] when: nested when without otherwise makes outer when skip its otherwise branch

[when.ts:127](src/operation/when.ts#L127) · area: operations-b · reported severity: high · verifier: sonnet

**Summary.** When the condition is false, the search for 'otherwise' increments the counter on each nested 'when' but only decrements it on 'otherwise'. A nested when/endWhen with no otherwise never decrements, so the outer block's own otherwise is consumed as a 'nested' one. Control then jumps to endWhen and the else branch never runs.

**Failure scenario.** Operations [when(1==2), when(...), endWhen, otherwise, endWhen]: newIndex becomes 4 (the outer endWhen) instead of 3 (otherwise), so the else branch is silently skipped (confirmed).

**Evidence.**

```ts
const otherWiseIndex = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: whenSystemName,
      matchingName: otherwiseSystemName,
    })
  );
```

**Fix.** Replace the two scans with one depth-aware scan starting after the when. Increment depth on 'when' and decrement on 'endWhen' when depth>0. At depth 0, return the first 'otherwise' or 'endWhen'. At depth>0, ignore 'otherwise'. Fall back to operations.length if none is found. Note that otherwise.ts's scan is already correct for a nested when/endWhen pair.

Original suggestion: Scan once with a depth counter: increment on when, decrement on endWhen, and return the first otherwise or endWhen found at depth 0.

**Verifier.** Traced src/operation/when.ts findNextFlowControlIndex with the helper findMatchingOperationIndex. Operations are [when(false), when, endWhen, otherwise, endWhen], and the outer when is at index 0. list is [when, endWhen, otherwise, endWhen]. The otherwise search sees the nested when and sets counter to 1. The nested endWhen is not the matching name, so it is ignored. The outer otherwise then has counter>0, so it only decrements the counter and returns false, giving -1. The fallback endWhen search sees the nested when (counter 1), then the nested endWhen (counter>0, decrement to 0), skips the otherwise, and matches the outer endWhen at list index 3. newIndex is therefore 4, not 3, so the else branch is skipped. No guard elsewhere: otherwise.ts uses the same helper and only runs if it is reached. The helper decrements only on the matching name, and the otherwise search never counts endWhen. A nested when without otherwise inside an if/else is valid configuration, so this can be triggered, but only when the outer condition is false and a nested when sits in the then-branch. Severity is medium rather than high: it needs nested control flow with a false outer condition, and it fails silently.

**Repro test.** `given operations [when(1==2), when(1==1), endWhen, otherwise, endWhen], when the outer when evaluates false, then scope.newIndex is 3 (the otherwise) rather than 4`

### 23. [medium] startAction never settles when actionOperationData is omitted

[start-action.ts:41](src/operation/start-action.ts#L41) · area: operations-b · reported severity: high · verifier: sonnet

**Summary.** actionOperationData is not @required. When it is missing, Object.keys(undefined) throws inside the fulfilment handler of actionInstance.start(). That rejection lands on the derived promise, which nothing handles; `reject` is only wired to start()'s own rejection. The outer promise never resolves or rejects, so the action chain hangs and an unhandled rejection is logged.

**Failure scenario.** requestAction {systemName:'Foo'} -> startAction {} (no actionOperationData): the returned promise stays pending forever (confirmed: raced against a 100ms timeout, it 'hung', with 'TypeError: Cannot convert undefined or null to object' unhandled).

**Evidence.**

```ts
actionInstance.start(newOperationData).then(() => {
      Object.keys(actionOperationData).forEach(key => {
        delete (newOperationData as any)[key];
      });
      internalResolve(resolve, {...newOperationData, actionInstance});
    }, reject);
```

**Fix.** Default `actionOperationData = {}` in the destructuring, and make the handler errors reject the outer promise, either with `.then(...).catch(reject)` or by making the operation async/await. Optionally throw a clear 'startAction: actionInstance is required' error when `actionInstance` is missing.

Original suggestion: Default actionOperationData to {}. Use .then(...).catch(reject), or async/await, so errors in the handler reject the outer promise. Throw a clear 'startAction: actionInstance is required' error when requestAction returned undefined.

**Verifier.** I traced the failure in src/operation/start-action.ts. `actionOperationData` is destructured from operationData and is not marked `@required` in IStartActionOperationData, so a valid configuration can omit it. `mergeOperationData` spreads `undefined` without error, so the merge step passes. After `actionInstance.start()` resolves, the fulfilment handler runs `Object.keys(actionOperationData)`, which throws a TypeError on undefined. `reject` is only passed as the second argument of `.then`, so it handles rejections of `start()` itself, not exceptions thrown by the first handler. The throw therefore rejects the derived promise, which nothing handles. The outer promise is never resolved or rejected, and the operation chain hangs with an unhandled rejection. `internalResolve` is never reached. No guard exists elsewhere. The only existing tests (start-action.spec.ts and the re-use-image-action integration spec) always supply `actionOperationData`, so the omitted case is not covered. Severity is medium, not high: it needs a config that leaves out an optional parameter, which is easy to do, but the effect is limited to that action chain hanging. The `actionInstance`-undefined part of the suggested fix is a separate robustness concern.

**Repro test.** `given startAction operation data without actionOperationData, when the operation is invoked and the action's start() resolves, then the returned promise settles (resolves with actionInstance and the merged data) instead of staying pending`

### 24. [medium] Eventbus iterates live handler array; once()/off() mid-broadcast skip next handler

[eventbus.ts:220](src/eventbus/eventbus.ts#L220) · area: eventbus-locale-util · reported severity: high · verifier: sonnet

**Summary.** _callHandlers runs forEach over the stored handlers array. A once() wrapper, or any handler that calls off() or a remover during dispatch, splices that array, and forEach then skips the handler that moved into the freed slot. Reproduced: once(A) then on(B), and one broadcast calls only A. TypedEventEmitter already copies the array for this reason; Eventbus does not.

**Failure scenario.** eventbus.once('timeline-firstframe', ...) (the engine does this in eligius-engine.ts:285) is registered before a controller's on('timeline-firstframe', ...). On the broadcast, the once wrapper splices index 0 and the controller handler is never called for that frame. The same happens when a handler detaches a controller (BaseController.detach removes listeners) during a broadcast.

**Evidence.**

```ts
const handlers = this._getEventHandlers(eventName, eventTopic);
...
      if (args?.length) {
        handlers.forEach((handler: TEventHandler) => handler(...args));
      } else {
        handlers.forEach((handler: TEventHandler) => handler());
      }
```

**Fix.** In _callHandlers, iterate a snapshot: const snapshot = handlers.slice(); then snapshot.forEach(...) for both the args and no-args branches. Add specs for once(A) then on(B) with a single broadcast calling both, and for a handler that removes itself or another handler during dispatch.

Original suggestion: Iterate a snapshot: const snapshot = handlers.slice(); snapshot.forEach(...). Add a spec for once plus on, and for removal during dispatch.

**Verifier.** I read src/eventbus/eventbus.ts. _callHandlers (lines 206-223) calls handlers.forEach directly on the array stored in the Map. _getEventHandlers returns that stored array, with no copy. once() (lines 91-98) wraps the handler and calls this.off(...) after it runs. off() splices the same array (lines 108-111). Array.prototype.forEach does not snapshot elements, so splicing at an index already visited shifts the later elements down one slot. The next iteration then starts one past the element that moved into the freed slot, and that handler is skipped. Trace for once(A) then on(B): handlers is [A', B]. Index 0 runs A', which splices and leaves [B]. The next index is 1, which is past the end, so B is never called. Nothing in the file guards against this: there is no copy, no deferred removal and no re-entrancy flag. The existing eventbus tests only check once() and its remover in isolation (eventbus.spec.ts lines 29-48), so none covers once plus on, or removal during dispatch. The scenario is reachable from a valid configuration. eligius-engine.ts:285 registers eventbus.once('timeline-firstframe', ...) and line 415 broadcasts that event. Any later on('timeline-firstframe') handler registered on the same bus, such as a controller's or an event action's, is skipped on that broadcast. The same skip happens whenever a handler detaches an earlier-registered listener during dispatch. I did not execute a test. The trace is deterministic and follows standard forEach semantics. The impact is real but limited to the specific registration order and event, so I rate it medium rather than high.

**Repro test.** `given a once handler registered before a regular handler on the same event, when the event is broadcast once, then both handlers are called exactly once`

### 25. [medium] LocaleLoader is never wired: $ref locale entries are loaded verbatim as translation data

[locale-loader.ts:27](src/locale/locale-loader.ts#L27) · area: eventbus-locale-util · reported severity: high · verifier: sonnet

**Summary.** ILocalesConfiguration allows ILocaleReference ({$ref}) values, and LocaleLoader exists to resolve them. No production code constructs LocaleLoader. EngineFactory passes each locales entry straight into loadLocale, so a $ref entry becomes a rosetta table {$ref: '...'} and every t() returns ''.

**Failure scenario.** Configuration has locales: {'en-US': {$ref: './locales/en-US.json'}}. The engine starts, LabelController calls t('nav.home'), and the result is '' (key not found under {$ref}). No error is raised, so the cause is invisible.

**Evidence.**

```ts
engine-factory.ts:187-190
    if (locales) {
      for (const [locale, data] of Object.entries(locales)) {
        localeManager.loadLocale(locale as TLanguageCode, data as TLocaleData);

types.ts: export type TLocaleEntry = TLocaleData | ILocaleReference;
(grep: 'new LocaleLoader' appears only in test/unit/locale/locale-loader.spec.ts)
```

**Fix.** Make the locale load async. In EngineFactory (or engine.init), partition the entries with isLocaleReference, call new LocaleLoader().loadAll(...) for the references, and then call loadLocale with the resolved data. Let load failures propagate with the locale name in the message. At minimum, make LocaleManager.loadLocale throw when given an ILocaleReference.

Original suggestion: In EngineFactory (or engine.init), split the entries with isLocaleReference, resolve references with LocaleLoader.loadAll before loadLocale, and surface load errors. Alternatively, have loadLocale reject ILocaleReference values with an error naming the locale.

**Verifier.** Traced the code and found no guard. The only non-test references to LocaleLoader are its own file and the barrel export in locale/index.ts. Nothing outside it resolves $ref: not ConfigurationResolver, not the importer, not LocaleManager. EngineFactory.createEngine (engine-factory.ts ~187-190) passes every configuration.locales entry directly to localeManager.loadLocale(locale, data as TLocaleData). The `as` cast hides the TLocaleEntry = TLocaleData | ILocaleReference union. ILocalesConfiguration (locale/types.ts:73) and CHANGELOG.md:39 advertise `{ "en-US": { "$ref": "./locales/en-US.json" } }` as supported config, so a valid configuration reaches this path. A $ref entry is then stored as the table {$ref: '...'}, lookups for real keys miss, and no error is raised. I did not execute the code, so the '' result from t() is inferred from the missing key. Severity is medium rather than high: the inline-locale path works, and only the documented external-file feature is dead.

**Repro test.** `given configuration with locales {'en-US': {$ref: './en-US.json'}}, when EngineFactory.createEngine is called and localeManager.t('nav.home') is read, then the loader is invoked and the translation is returned (today it returns '' and no error is raised)`

### 26. [medium] VideoPositionSource init never settles on load error or blocked preload

[video-position-source.ts:326](src/timelineproviders/position-sources/video-position-source.ts#L326) · area: timeline-providers-adapters · reported severity: high · verifier: sonnet

**Summary.** doInit only resolves on 'canplay' and never rejects. A media error, a missing container, or a browser that ignores preload (iOS Safari before a user gesture) leaves init(), and therefore engine.init(), pending forever. A videojs() throw inside the setTimeout becomes an uncaught exception instead of a rejection.

**Failure scenario.** The configured video src returns 404: video.js fires 'error' and never 'canplay', so engine.init() hangs and the presentation shows nothing, with no error. If the selector matches nothing, _createVideoElement appends nowhere and videojs(id) throws inside the timer, so the promise never settles.

**Evidence.**

```ts
`return new Promise<void>(resolve => { this._createVideoElement(); setTimeout(() => { this._player = videojs(this._videoElementId, {...}, () => { ... this._player.one('canplay', () => { resolve(); }); this._player.load(); }); }, 0); });`
```

**Fix.** Give the promise a reject parameter. Wrap the videojs() call in try/catch and reject on a throw. Register player.one('error', () => reject(new Error(...))) before load(). Reject early if $(selector) is empty. Optionally resolve on 'loadedmetadata' in addition to 'canplay', and add a timeout.

Original suggestion: Add a reject path: register `this._player.one('error', () => reject(new Error(`VideoPositionSource: failed to load ${...}`)))`, wrap the videojs() call in try/catch and reject, and reject early when the container is missing. Optionally resolve on 'loadedmetadata' rather than 'canplay' to cope with preload restrictions.

**Verifier.** Traced src/timelineproviders/position-sources/video-position-source.ts lines 106-150. doInit returns new Promise(resolve => ...) with no reject parameter. The only settle path is player.one('canplay', resolve). There is no 'error' listener (grep for 'error' finds none), no timeout and no try/catch around videojs(). BasePositionSource.init (line 93) simply awaits doInit, so init() hangs whenever 'canplay' never fires. A 404 or unsupported source makes video.js fire 'error' and never 'canplay', so init() stays pending forever. A throw from videojs() inside the setTimeout callback is an uncaught exception, not a rejection, so the promise stays pending. No guard elsewhere was found. The missing-selector case is an invalid configuration, and the 404 or unplayable-source case is the realistic trigger, so severity is medium rather than high. The iOS preload claim is plausible but depends on browser runtime behaviour, so I treated it as unsettled.

**Repro test.** `given a VideoPositionSource whose player emits 'error' and never 'canplay', when init() is called, then init() rejects with an error instead of remaining pending`

### 27. [medium] Recursive executeOperation overflows the stack for large forEach loops

[action.ts:132](src/action/action.ts#L132) · area: lens-performance · reported severity: high · verifier: sonnet

**Summary.** Synchronous operations chain by direct recursion, so stack depth equals the total number of operation executions including every loop iteration. I reproduced it: a forEach over 6000 items with one inner operation throws RangeError: Maximum call stack size exceeded, while 3000 items pass.

**Failure scenario.** An action with startOperations [forEach {collection: <6000 items>}, someSyncOp, endForEach] fails: start() rejects with RangeError and the action's DOM work is left half done. Measured with Action plus the real forEach/endForEach in vitest.

**Evidence.**

```ts
`} else { this.executeOperation(operations, ++operationIndex, resolve, reject, operationResult); }`
```

**Fix.** Make executeOperation iterative. Loop over the operations and keep the scope and newIndex handling. For sync results, assign the result to previousOperationData, advance the index and continue the loop. For promise results, return after attaching .then(d => this.executeOperation(operations, nextIndex, resolve, reject, d)).catch(reject). Wrap the sync body in try/catch so a thrown error still reaches reject().

Original suggestion: Turn executeOperation into a loop: `while (index < ops.length) { ...; const r = op(); if (isPromise(r)) { r.then(d => this.executeOperation(ops, index+1, ...)); return; } data = r; index++; }`. This also removes one stack frame per sync operation on every action start.

**Verifier.** Action.executeOperation (src/action/action.ts line 132) calls itself directly after each synchronous operation, with no trampolining or guard. A forEach loop re-enters the same recursion through scope.newIndex, so stack depth grows with every operation execution across all iterations. I ran a temporary vitest spec using the real Action, forEach and endForEach, with one inner sync op. 3000 items passed and 6000 items failed with RangeError: Maximum call stack size exceeded, matching the report. I deleted the temp spec afterwards. No existing test covers this: the only "stack" mention in src/test is a comment in the benchmarks spec. Impact is limited, since a loop needs several thousand items. Typical timeline configurations loop over far fewer, and any promise-returning op resets the stack. The overflow rejects start(), and the action's earlier operations have already run. That is why this is medium rather than high.

**Repro test.** `given an Action with forEach over 6000 items, one sync inner op and endForEach, when start is called, then it resolves and the inner op ran 6000 times instead of rejecting with RangeError`

### 28. [medium] Action editors copy the action, so edits never reach the factory configuration

[action-editor.ts:142](src/configuration/api/action-editor.ts#L142) · area: configuration-tools · reported severity: high · verifier: sonnet

**Summary.** ActionEditor/EndableActionEditor/TimelineActionEditor replace this.actionConfig with a new object on every edit (addStartOperation, setName, remove/move ops, setDuration, updateConfiguration via structuredClone). ConfigurationFactory.configuration.actions still points at the original object, and nothing writes the new one back. Edits made through factory.editAction/editInitAction/editTimelineAction/editEventAction are lost.

**Failure scenario.** f.init('en-US'); const id = f.createAction('A').getId(); f.editAction(id).addStartOperation('selectElement',{selector:'#x'}); f.editAction(id).setName('B'); f.getConfiguration().actions[0] -> startOperations.length 0, name 'A'. Verified with a temporary vitest spec.

**Evidence.**

```ts
this.actionConfig = {
      ...this.actionConfig,
      startOperations,
    };  (also setName: `this.actionConfig = {...this.actionConfig, name}`; updateConfiguration: `this.actionConfig = structuredClone(this.actionConfig);`)
```

**Fix.** Mutate the original action config in place in the editors. For example, use Object.assign(this.actionConfig, {name}) or this.actionConfig.startOperations = startOperations. Alternatively, have ConfigurationFactory pass an onChange callback that replaces the entry in its owning array. Make updateConfiguration a no-op or write the clone back. Add round-trip tests: factory.editAction(id).setName / addStartOperation / removeStartOperation / moveStartOperation, then getConfiguration(), for all four edit* entry points including TimelineActionEditor.setDuration.

Original suggestion: Mutate the action config in place, as the creators do, or have the editor write the new object back into the owning collection (for example via a callback or index passed by ConfigurationFactory). Add round-trip tests: factory -> editAction -> getConfiguration.

**Verifier.** Traced through the real code. ConfigurationFactory.editAction, editInitAction, editEventAction and editTimelineAction (configuration-factory.ts lines 497-553) find the action object in the owning array and pass that reference to a new editor. ActionEditor then does `this.actionConfig = {...this.actionConfig, ...}` in setName, addStartOperation, removeStartOperation, moveStartOperation, removeEndOperation, moveEndOperation and TimelineActionEditor.setDuration. updateConfiguration does `structuredClone`, and getConfiguration swaps in a callback result. Each of these rebinds the editor's private field to a new object. The editors are only constructed in those four factory methods. Nothing passes a write-back callback or index, and the factory never reads the editor's state. So the object in `configuration.actions` and the other lists stays unchanged and the edits are lost. There is no guard or invariant elsewhere. The only edits that survive are the ones that mutate shared nested objects in place. These are addEndOperation (`this.actionConfig.endOperations = ...` mutates the original object) and OperationEditor's edits to operationConfig fields, which are shared references. That in-place pattern is likely why the bug was missed. I did not run a test, but the scenario follows directly from the code. Severity: this is a public fluent API whose edit* methods silently do nothing for the main edit paths. The impact is limited to edit-existing-action flows, because the create paths mutate in place. Medium-high is fair; I rate it medium because the creators' own flows work and the damage is limited to editing an existing action.

**Repro test.** `given a factory with one action created via createAction, when editAction(id).addStartOperation('selectElement', {selector:'#x'}) and setName('B') are called, then getConfiguration().actions[0] has name 'B' and one start operation`

### 29. [medium] Schema generator skips 8 operations, so valid configs fail the oneOf

[generate-schemas.ts:110](src/tools/schema-tools/generate-schemas.ts#L110) · area: configuration-tools · reported severity: high · verifier: sonnet

**Summary.** Operation schemas are found by regex over src/operation/index.ts. The regex only matches single-line `export type {IXxxOperationData}`. It misses multi-line type exports (clearStorage) and every operation that has no data interface (endWhen, otherwise, endForEach, breakForEach, continueForEach, setOperationData, addGlobalsToOperation). IOperationConfiguration is then replaced by a oneOf over only the generated files, so configurations that use these operations fail schema validation.

**Failure scenario.** A configuration whose startOperations contain {systemName:'endWhen'} or {systemName:'clearStorage', operationData:{storageType:'local'}} is validated against jsonschema/eligius-configuration.json. No oneOf branch matches, because jsonschema/operations has no end-when.json or clear-storage.json (72 schemas for 80 exported operations), so validation fails.

**Evidence.**

```ts
const typeRegex = /export type \{(I\w+OperationData)\}/g;
...
processed.definitions[name] = {
  description: 'An operation configuration. ...',
  oneOf: operationOneOf,
};
```

**Fix.** In generateOperationSchemas, enumerate operations from the actual exports of src/operation/index.ts (ts-morph or a dynamic import), not a single-line regex. At minimum, make the regex multi-line tolerant: /export type \{([^}]*)\}/g, then split on commas and keep names matching I\w+OperationData. For exported operations with no data interface, emit a systemName-only schema using createFallbackOperationSchema without the operationData property. Fail the script if any exported operation has no schema.

Original suggestion: Enumerate operations from the runtime exports (Object.keys of '@operation/index.ts', or ts-morph export symbols) rather than a regex. Emit a minimal systemName-only schema for operations without a data interface. Fail the script if any exported operation lacks a schema.

**Verifier.** Traced it. generate-schemas.ts line 110 uses the regex /export type \{(I\w+OperationData)\}/g. That only matches a single-line brace. src/operation/index.ts exports IClearStorageOperationData inside a multi-line `export type {` block (around line 22), so it is missed. Operations with no data interface (endWhen, otherwise, and the like) are never matched either. jsonschema/operations has 72 files, while index.ts has 79 `export {` lines. There is no end-when, otherwise, clear-storage, break-for-each, continue-for-each, set-operation-data or add-globals-to-operation file. Only end-action.json exists among the end-* names. postProcessConfigSchema (lines 348-368) builds IOperationConfiguration as a oneOf over exactly the files in that directory, and I confirmed the generated schema contains that oneOf. Each branch has additionalProperties:false and a systemName const, so an operation like {systemName:'endWhen'} matches no branch and validation fails. I found no guard, no test covering it (no src/test file references the schema), and no runtime schema validation (no ajv use). The impact is therefore limited to the published JSON schema, which editors, IDEs and external validators use, and which gets false errors on valid configs. The engine itself is unaffected. The jsonschema output is gitignored and regenerated at build time. Severity is medium rather than high, because the defect is only reachable through tooling and not at runtime, though endWhen, otherwise and the loop operations are common.

**Repro test.** `given the generated jsonschema/operations directory, when listing schema files against operation exports in src/operation/index.ts, then every exported operation (including endWhen, otherwise, clearStorage) has a matching schema file and a config with systemName 'endWhen' validates against IOperationConfiguration`

### 30. [medium] Operation schemas mark @dependency properties (e.g. selectedElement) required

[generate-schemas.ts:236](src/tools/schema-tools/generate-schemas.ts#L236) · area: configuration-tools · reported severity: high · verifier: sonnet

**Summary.** isRequired is true for any property TypeScript lists as non-optional (dataSchema.required). The generator ignores @dependency, so runtime-supplied properties like selectedElement become required in operationData. operationData is also made required whenever properties exist, although IOperationConfiguration.operationData is optional.

**Failure scenario.** {systemName:'addClass', operationData:{className:'show'}}: the generated add-class.json has required ['selectedElement','className'], so this canonical CLAUDE.md example fails schema validation.

**Evidence.**

```ts
const isRequired =
  propSchema.description?.includes('@required') ||
  propSchema.required === true ||
  dataSchema.required?.includes(propName);
... schema.required.push('operationData');
```

**Fix.** Treat @dependency properties as runtime-supplied. Skip them in required, and preferably omit them from operationData.properties. The generator currently never reads the @dependency tag, so also add it to the tags stripped in the description cleanup. Push 'operationData' into schema.required only when at least one remaining property is required. Optionally base required on the @required tag instead of TypeScript optionality, but check that this keeps existing configurations valid.

Original suggestion: Add 'dependency' to extraTags and drop @dependency properties from operationData.properties and required. Base required on the @required tag rather than TS optionality, and push 'operationData' to required only when at least one property is @required.

**Verifier.** I traced it through the real code and the generated output. In createOperationSchema (generate-schemas.ts lines 236-239), isRequired is true when dataSchema.required includes the property. That is the TypeScript non-optional list from ts-json-schema-generator. Nothing in schema-tools mentions 'dependency': the grep for it returned no matches, and the description cleanup at lines 248-253 only strips @type, @required, @erased and @output. The committed jsonschema/operations/add-class.json shows the result: operationData.required is ["selectedElement","className"], and "operationData" is also in the top-level required (line 219). The operation schemas are wired into the main config schema. postProcessConfigSchema replaces IOperationConfiguration with a oneOf of $ref operations/*.json, and the generated eligius-configuration.json references operations/add-class. So {systemName:'addClass', operationData:{className:'show'}} fails validation, because selectedElement is supplied at runtime by a previous operation. I found no guard and no test that covers this. The main caveat is impact. This only affects JSON-schema validation and editor tooling. The runtime engine does not use these schemas, so it is not high severity.

**Repro test.** `given addClass operation configuration with only className in operationData, when validated against generated jsonschema/operations/add-class.json, then validation passes (currently fails because selectedElement is required)`

### 31. [medium] Resolver accepts unknown operation names and sets instance: undefined

[configuration-resolver.ts:152](src/configuration/configuration-resolver.ts#L152) · area: configuration-tools · reported severity: high · verifier: sonnet

**Summary.** resolveOperation takes whatever the importer returns. EligiusResourceImporter returns {[name]: undefined} for an unknown name, so a typo resolves without error and fails later, at action execution time, with an unrelated TypeError. CLAUDE.md requires a fast failure that names the JSON path.

**Failure scenario.** actions[0].startOperations[0].systemName = 'selectElemnt' -> process() succeeds and resolved instance is undefined (verified). The engine throws later, when the action first runs on the timeline.

**Evidence.**

```ts
instance: importer.import(operationConfig.systemName)[
      operationConfig.systemName
    ],
```

**Fix.** In resolveOperation, after import, throw if typeof instance !== 'function'. Include the systemName and operation id in the message. Threading a full JSON path through resolveActions and resolveTimelines is optional and can be done with index parameters.

Original suggestion: After import, check typeof instance === 'function'. If not, throw with the operation name and path, e.g. `Unknown operation 'selectElemnt' at actions[0].startOperations[0].systemName`. Thread a path string through resolveActions/resolveTimelines.

**Verifier.** Traced the code. EligiusResourceImporter.import returns {[name]: value}, where value is undefined for an unknown name. ConfigurationResolver.resolveOperation (lines 144-156) assigns instance without any check. There is no other validation: action.ts line 104 calls operationInfo.instance.call(...) directly, so an unknown name only fails at run time with "Cannot read properties of undefined (reading 'call')", which names neither the operation nor the JSON path. The existing resolver tests only cover valid names. This violates the CLAUDE.md fail-fast rule. Severity is medium rather than high because it only affects invalid configurations (a typo). It does not corrupt engine state or break valid ones, and the failure is loud, though late and unhelpful. Init actions fail at init, but timeline and event actions fail only when they first run.

**Repro test.** `given a config whose action startOperation has systemName 'selectElemnt', when ConfigurationResolver.process is called, then it throws an error naming 'selectElemnt'`

### 32. [medium] Same-type timelines share one position source sized to the first one's duration

[engine-factory.ts:390](src/engine-factory.ts#L390) · area: engine-core · reported severity: high · verifier: sonnet

**Summary.** createTimelineProvidersForConfig builds one position source per timeline type, using the duration of the first timeline of that type. BasePositionSource._duration is readonly, and switchTimeline only updates `loop`, so every other timeline of that type runs with the wrong duration.

**Failure scenario.** Two animation timelines, t1 = 10s and t2 = 20s. switchTimeline('t2') then engine.duration returns 10 (confirmed with a probe). The RAF source reaches its end boundary at 10s, emits timelineComplete and deactivates, so actions keyed between 10 and 20 never run, and seek(15) is rejected as out of bounds.

**Evidence.**

```ts
// Find the first timeline that matches this type
        const matchingTimeline = timelines.find(t => t.type === timelineType);
...
        acc[timelineType as TimelineTypes] = this.createTimelineProviderInfo(
          matchingTimeline,
          settings
        );
```

**Fix.** Create the position source per timeline, keyed by uri. Alternatively, add a duration setter on BasePositionSource and IPositionSource, and have switchTimeline call it with timelineConfig.duration before activate(). Mediaplayer sources probably need separate handling, because their duration comes from the video.

Original suggestion: Create a position source per timeline (keyed by uri), or give IPositionSource a way to reset duration that switchTimeline calls with timelineConfig.duration.

**Verifier.** I traced the claim through the code and found nothing that stops it.  1. `createTimelineProvidersForConfig` (src/engine-factory.ts, about line 371) loops over `timelineProviderSettings`. For each type it does `timelines.find(t => t.type === timelineType)` and builds one provider with that first timeline. `createPositionSourceForTimeline` then passes that timeline's `duration` to the source constructor. 2. `BasePositionSource._duration` is `private readonly` (base-position-source.ts:48). It is set once in the constructor, and `getDuration()` returns it. I grepped for `setDuration`, `updateDuration` and `.duration =` in non-test source and found no way to change it later. 3. `EligiusEngine.switchTimeline` (eligius-engine.ts:253) looks up the new timeline's provider with `this.timelineProviders[timelineConfig.type]`. For two timelines of the same type that is the same source object, so it is kept. The only per-timeline update is `this._activePositionSource.loop = timelineConfig.loop`. `timelineConfig.duration` is never applied. 4. `engine.duration` and `seek()` both read `getDuration()` from the source (lines 103 and 208). `seek()` rejects any position above that value. `RafPositionSource` stops at `getDuration()` (raf-position-source.ts:153-168). So a 20s timeline run on a source built for 10s ends at 10s and rejects `seek(15)`. 5. The existing tests do not cover this. engine-decomposed.spec.ts only asserts that different types get different sources. The engine-factory-create-timeline-providers spec tests one timeline per type. The factory's own doc comment says "first timeline that matches the type", so the first-match choice is intentional, but that does not make the resulting behaviour correct.  The case is reachable from a valid configuration. A mixed-duration, same-type animation configuration is plausible, and `switchTimeline` is a public API. The failure is wrong duration and early completion, not a crash or data corruption, and a user can work around it by using timelines of equal duration. I rate it medium rather than high.

**Repro test.** `given two animation timelines of 10s and 20s, when switchTimeline to the 20s one is called, then engine.duration is 20 and seek(15) is accepted`

### 33. [medium] Per-engine destroy() leaves interceptor and action-registry listener on eventbus

[engine-factory.ts:156](src/engine-factory.ts#L156) · area: lens-lifecycle-memory · reported severity: high · verifier: sonnet

**Summary.** createEngine registers an ActionRegistryEventbusListener and a RequestVideoUriInterceptor on the factory's shared eventbus. Their removers go into the factory-wide _eventRemovers, and only EngineFactory.destroy() drains that list. The per-engine destroy() returned by createEngine never removes them, so recreating an engine on the same factory piles them up, and the destroyed engine's event actions keep firing.

**Failure scenario.** Run createEngine(cfgA) where cfgA has eventActions on 'language-change', call destroy(), then run createEngine(cfgB) on the same factory and init it. A 'language-change' broadcast still runs cfgA's event actions through the old ActionRegistryEventbusListener. Their selectElement resolves against the new engine root and mutates cfgB's DOM. Each broadcast of 'request-timeline-uri' also emits 'before-request-timeline-uri' twice, once per leaked interceptor.

**Evidence.**

```ts
this._eventRemovers.push(
        this._eventbus.registerEventlistener(actionRegistryListener)
      );
    ...
    this._eventRemovers.push(
      this._eventbus.registerInterceptor(
        'request-timeline-uri',
        new RequestVideoUriInterceptor(this._eventbus)
      )
    );
...
      destroy: async () => {
        engineInputAdapter.disconnect();
        localeEventbusAdapter.disconnect();
        engineEventbusAdapter.disconnect();
        await engineInstance.destroy();
      },
```

**Fix.** Collect the two removers in a local array inside createEngine (still pushing to this._eventRemovers is optional, and the removers are idempotent so double-calling is safe). Call them in the returned destroy() after disconnecting the adapters, before or after engineInstance.destroy().

Original suggestion: Keep the two removers in local variables inside createEngine and call them from the returned destroy(). Leave only the constructor's request handlers in the factory-wide _eventRemovers.

**Verifier.** Traced the code in src/engine-factory.ts. createEngine pushes the removers for the ActionRegistryEventbusListener (lines 156-158) and the RequestVideoUriInterceptor (lines 161-166) onto the factory-wide this._eventRemovers. Only EngineFactory.destroy() (lines 93-97) drains that list. The per-engine destroy() returned at lines 226-236 only disconnects the three adapters and calls engineInstance.destroy(). EligiusEngine.destroy() (eligius-engine.ts ~447) runs only its own _eventbusRemovers and does not clear the shared eventbus or remove these registrations. Eventbus.clear() runs only from the eventbus's own teardown. No guard exists. ActionRegistryEventbusListener has no teardown and keeps its action registry. handleEvent still calls action.start for the destroyed engine's actions, and RequestVideoUriInterceptor.intercept broadcasts 'before-request-timeline-uri' once per leaked instance. No test in src/test covers this (grep for _eventRemovers and registerEventlistener finds only mocks and unrelated eventbus specs). The limit is reachability. It needs a factory (and its shared eventbus) reused across several createEngine calls. A single-use factory is destroyed via factory.destroy(), which drains the list, so the usual pattern is unaffected. Reuse is possible, because the constructor accepts options.eventbus. This is a real lifecycle leak, but it is narrower than high severity.

**Repro test.** `given a factory with a real Eventbus and a config with eventActions on 'language-change', when the engine's destroy() is called and 'language-change' is broadcast, then the action's start is not invoked and only one 'before-request-timeline-uri' is emitted after a second createEngine`

### 34. [medium] NavigationController never calls _initHistory, so initial state is lost

[navigation-controller.ts:56](src/controllers/navigation-controller.ts#L56) · area: controllers · reported severity: medium · verifier: opus

**Summary.** `this._initHistory.bind(this);` creates a bound function and throws it away. The initial highlight from the URL hash never happens and activeNavigationPoint stays null, so request-current-navigation answers null until the user clicks a menu item.

**Failure scenario.** Page loaded at '#/chapter2' -> NavigationController.attach -> no menu item gets 'current-menu-item' and activeNavigationPoint is null. RoutingController's before-request-video-url -> request-current-navigation -> callback(null) -> no history state is pushed for the first video.

**Evidence.**

```ts
this._buildHtml(this.container, this.navigation);
    this._initHistory.bind(this);
  }
```

**Fix.** Replace line 56 with `this._initHistory();`. In _initHistory, guard the lookup: `const nav = navId ? this.navLookup[navId] : undefined; const videoIndex = nav?.videoUrlIndex ?? 0; this.activeNavigationPoint = this.navVidIdLookup[videoIndex] ?? null; this._highlightMenu(videoIndex);`. This sets activeNavigationPoint to the entry from the hash rather than always entry 0, and it does not throw for an unknown hash.

Original suggestion: Call `this._initHistory();`. Guard `nav` in _initHistory because navLookup[navId] can be undefined for an unknown hash.

**Verifier.** src/controllers/navigation-controller.ts:56 is `this._initHistory.bind(this);`. That line creates a bound function and throws it away, so `_initHistory` (lines 59-68) never runs. Nothing else calls it: the only reference is line 56, and no test in src/test/unit/controllers/NavigationController.spec.ts checks the initial history state. The test at line 241 sets activeNavigationPoint by sending a navigation event. So after attach, activeNavigationPoint keeps its field default of null (line 25), and no menu item gets 'current-menu-item' from the URL hash. Until the user clicks a menu item or a navigate-to-video-url event arrives, _handleRequestCurrentNavigation (lines 83-99) passes null to its callback and _pushCurrentState returns early at line 115. NavigationController is a public, registered controller (src/controllers/index.ts:13), and a valid addControllerToElement configuration reaches this code. This is not the same root cause as any confirmed bug. Severity stays medium: the controller and its other handlers still work, but the initial highlight and the first history push are silently missing for every page that uses it. Note that just calling the method would expose a second bug: for an unknown hash, `this.navLookup[navId]` is undefined, and `nav.videoUrlIndex` at line 65 would throw during attach.

**Repro test.** `given navigation json and window location hash '#/nav1', when NavigationController is attached, then activeNavigationPoint is set and #nav_<index> has class current-menu-item`

### 35. [medium] createElement builds HTML by string concatenation without escaping (XSS)

[create-element.ts:59](src/operation/create-element.ts#L59) · area: operations-a · reported severity: medium · verifier: opus

**Summary.** Attribute values and `text` are interpolated straight into an HTML string that is passed to `$()`. They can be resolved from `$operationdata`, `$globaldata` or `$scope`, for example from getQueryParams or getFormData output. Any markup or quote in them is parsed as HTML, which breaks the project rule to sanitize user-provided content before it reaches the DOM.

**Failure scenario.** getQueryParams, then createElement {elementName:'div', text:'$operationdata.queryParams.name'} with `?name=<img src=x onerror=alert(1)>`. The img element is created and its onerror handler runs once it is inserted. An attribute value `x" onmouseover="alert(1)` also injects a handler.

**Evidence.**

```ts
.map(([key, value]) => `${key}="${value}"`)
...
  const template = text
    ? $(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
    : $(`<${elementName}${serializedAttrs}/>`);
```

**Fix.** Validate elementName against /^[a-z][a-z0-9-]*$/i and throw an error naming the operation if it does not match. Build the element with $(document.createElement(elementName)). Apply the attributes that have a value with .attr(key, String(value)). Set content with .text(text), not by interpolating it into markup. If some configurations depend on `text` being HTML, add an explicit opt-in flag (for example `html: true`) and document that it is unsafe for untrusted input.

Original suggestion: Build the element with `$(document.createElement(elementName))`, then `.attr(attributes)` and `.text(text)`. Validate elementName against /^[a-z][a-z0-9-]*$/i.

**Verifier.** I read src/operation/create-element.ts. Line 52 runs resolvePropertyValues on operationData, so `text` and the attribute values can be `$operationdata.*`, `$scope.*` or `$globaldata.*` references. The unit test at src/test/unit/operation/create-element.spec.ts:65 resolves `$scope.currentItem.label`, which shows these references are supported. Lines 56-60 then build attributes with `${key}="${value}"`, with no escaping of quotes or `<`. Lines 62-64 put `text` straight into a markup string passed to `$()`, and jQuery parses that string as HTML.  The source of untrusted input exists and is a documented operation. src/operation/get-query-params.ts:38-47 copies window.location.search into operationData.queryParams without changes. So the configuration [getQueryParams, createElement {elementName:'div', text:'$operationdata.queryParams.name'}] is valid. With `?name=<img src=x onerror=alert(1)>` it creates a real img element with a live handler. jQuery creates it in the current document, so the image can start loading and the handler can fire even before the element is inserted. An attribute value containing `"` breaks out of the attribute in the same way.  Nothing guards against this: there is no escaping, sanitising or elementName validation anywhere in the operation. The existing tests only use benign strings. This violates the CLAUDE.md rule "Sanitize user-provided content before inserting it into the DOM".  It is not a duplicate. The confirmed security bugs are prototype pollution in setData and Function-constructor access through property chains, which are different defects. setElementContent (`selectedElement.html(template)`) has a related but separate raw-HTML path.  Severity stays medium. Exploiting it needs a configuration author to route URL, form or global data into createElement, but that is a natural use of documented operations.

**Repro test.** `given text resolved from operation data containing '<img src=x onerror=alert(1)>', when createElement is called with elementName 'div', then template contains no img element and its text equals the raw string`

### 36. [medium] getGlobals(name) structuredClones values, throwing on jQuery/DOM/function globals

[globals.ts:10](src/operation/helper/globals.ts#L10) · area: lens-security-robustness · reported severity: medium · verifier: opus

**Summary.** setGlobalData stores any operation-data value, including selectedElement (jQuery) or functions. getGlobals(name), used by addGlobalsToOperation, deep-copies with structuredClone, which throws DataCloneError for DOM nodes and functions. Meanwhile getGlobals() with no name returns the live cache uncopied, so '$globaldata.x' and addGlobalsToOperation behave differently.

**Failure scenario.** setGlobalData {propertyNames:['selectedElement']} followed by addGlobalsToOperation {globalProperties:['selectedElement']} -> DataCloneError thrown from the action; the message does not name the operation.

**Evidence.**

```ts
const value = name ? cache[name] : cache;
  return value && value !== cache ? deepCopy(value) : value;
```

**Fix.** In _getGlobals, return the value as-is when it is a jQuery instance, a DOM Node or a function. Deep-copy only plain data, the same way resolvePropertyValues skips these types. Alternatively, drop the copy and return the reference, to match the `$globaldata.` read path. Either way, both read paths should use the same copy semantics. If a copy can still fail, catch it in addGlobalsToOperation and rethrow an error that names the operation and the global key.

Original suggestion: Copy only plain JSON-like data (skip jQuery instances, DOM nodes and functions, as resolvePropertyValues does), or catch the error and rethrow it naming addGlobalsToOperation and the global key. Make both read paths use the same copy semantics.

**Verifier.** Traced in the real code. src/operation/set-global-data.ts:22-29 copies any listed operation-data property into the cache, with no type filter, so `setGlobalData {propertyNames:['selectedElement']}` after `selectElement` stores a live jQuery object. src/operation/add-globals-to-operation.ts:29 calls `getGlobals(name)`. src/operation/helper/globals.ts:9-10 deep-copies any truthy named value through `deepCopy`, and src/operation/helper/deep-copy.ts:3-6 uses `structuredClone`, which throws DataCloneError on HTMLElement own properties (a non-empty jQuery set holds elements at indices 0..n) and on functions. The JSON fallback would not throw, but it would also strip the object. I found no guard: neither operation checks the value's type, and nothing catches the error. Even for an empty jQuery object, structuredClone drops the prototype, so the copy has no jQuery methods.  The inconsistency in the report also holds. `getGlobals()` with no name returns the live cache (`value !== cache` short-circuits), so the `$globaldata.x` paths in resolve-external-property-chain.ts:36, set-data.ts:81 and log.ts:31 see uncopied references, while addGlobalsToOperation gets a clone.  The tests do not cover this. src/test/unit/operation/helper/globals.spec.ts uses only strings, and the add-globals spec uses plain data. setGlobalData's documentation does not limit globals to serialisable data, so the failure is reachable from a valid configuration.  This is not a duplicate. None of the confirmed bugs concern globals copying; the setData prototype-pollution bugs are a different defect.  Severity is medium. Only configurations that store DOM, jQuery or function values as globals are affected, and plain data works. When it does fail, the error is unlabelled and aborts the action.

**Repro test.** `given setGlobalData stored a non-empty jQuery selectedElement, when addGlobalsToOperation requests 'selectedElement', then it returns the same jQuery instance without throwing`

### 37. [medium] reparentElement uses .remove(), destroying jQuery data, handlers and controllers

[reparent-element.ts:32](src/operation/reparent-element.ts#L32) · area: operations-b · reported severity: medium · verifier: opus

**Summary.** jQuery .remove() strips all jQuery data and event handlers from the element. That includes the 'eligiusEngineControllers' data used by addControllerToElement and removeControllerFromElement. After a reparent, attached controllers can no longer be found or detached, and their eventbus listeners leak. jQuery .detach() keeps both.

**Failure scenario.** Element with controllers data and a jQuery click handler -> reparentElement -> $('#s').data('eligiusEngineControllers') is undefined and the click handler no longer fires (confirmed). A later removeControllerFromElement only warns 'not found', and the controller is never detached.

**Evidence.**

```ts
selectedElement.remove().appendTo(newParentSelector);
```

**Fix.** Replace line 32 with `selectedElement.detach().appendTo(newParentSelector);`, or just `selectedElement.appendTo(newParentSelector);`, since `appendTo` moves an existing node. Update the spec to use a real jsdom element. It should assert that `data(controllersDataName)` and a jQuery click handler survive the reparent.

Original suggestion: Use selectedElement.detach().appendTo(newParentSelector), or simply appendTo, which moves the node. Add a spec asserting data and handlers survive.

**Verifier.** src/operation/reparent-element.ts:32 calls `selectedElement.remove().appendTo(newParentSelector)`. jQuery's documented `.remove()` runs `jQuery.cleanData` on the element and all of its descendants. That deletes every jQuery data entry and every jQuery-bound event handler. `.detach()` is the method that keeps them.  Controllers are stored in jQuery data. `attachControllerToElement` (src/operation/helper/attach-controller-to-element.ts) writes them with `element.data(controllersDataName, [])`, and `getElementControllers` reads them back. So after a reparent the list is gone for the element and for any descendant that has controllers. A later `removeControllerFromElement` (src/operation/remove-controller-from-element.ts) finds nothing. It only logs "controller ... was not found" and never calls `controller.detach(eventbus)`, so the controller's eventbus listeners leak.  Nothing guards against this. The only spec, src/test/unit/operation/reparent-element.spec.ts, uses a MockElement and checks that `remove()` was called. That shows the call is deliberate but does not show the data loss is intended or documented. The operation's TypeDoc says only that it "moves" the element.  The trigger is a valid configuration: selectElement, addControllerToElement, reparentElement, then removeControllerFromElement in end operations. Controllers that attach through native `addEventListener` stay functional, but the engine can no longer find them to detach them. Medium severity is fair. Reparenting is a supported DOM operation, the leak is silent, and it only happens when an element with controllers or jQuery handlers is reparented.  None of the confirmed bugs has this root cause.

**Repro test.** `given an element with an attached controller and a jQuery click handler, when reparentElement moves it to a new parent, then getElementControllers still returns the controller and the click handler still fires`

### 38. [medium] httpPost/httpPut fail on successful 204 No Content responses

[http-post.ts:76](src/operation/http-post.ts#L76) · area: operations-b · reported severity: medium · verifier: opus

**Summary.** httpPost and httpPut always call response.json() after an ok status. An empty body (204, or 200 with no content, which is common for PUT) makes json() throw, and the successful request surfaces as an error. httpDelete already checks content-type for this case.

**Failure scenario.** PUT to an API that returns 204 -> 'httpPut: Unexpected end of JSON input' is thrown and the action chain aborts, even though the server accepted the request.

**Evidence.**

```ts
const data = await response.json();
    operationData.response = data;
```

**Fix.** Add a shared helper in src/operation/helper/ (for example parseHttpResponseBody(response)). It returns null when the status is 204 or 205, or when content-length is '0'. It calls json() only when content-type includes application/json. Otherwise it reads text() and returns null when the text is empty. httpPost, httpPut and httpDelete should all use this helper.

Original suggestion: Mirror httpDelete: parse JSON only when the status is not 204 and content-type includes application/json; otherwise set response to null. Factor the three HTTP operations into one shared helper.

**Verifier.** I traced the reported path in the real code. In src/operation/http-post.ts, lines 70-77 check only response.ok and then always call `await response.json()`. src/operation/http-put.ts line 76 does the same. A real fetch Response for a 204, or a 200 with an empty body, rejects in json() with a SyntaxError ("Unexpected end of JSON input"). The catch at http-post.ts line 83 rethrows it as `httpPost: Unexpected end of JSON input`, so the operation chain aborts even though the server accepted the request. Nothing upstream guards this: url, body and headers are all valid configuration. httpDelete (src/operation/http-delete.ts lines 66-69) handles this case explicitly by checking content-type, which shows the omission in post and put was not intended. src/test/unit/operation/http-delete.spec.ts covers 204, but no http-post or http-put spec mentions 204 or an empty body. This is not a duplicate: no confirmed bug touches the HTTP operations. Medium severity is fair. It breaks a documented operation against common REST APIs, but only for endpoints that return no body.

**Repro test.** `given a PUT endpoint that responds 204 No Content with an empty body, when httpPut runs, then it resolves with status 204 and response null instead of throwing 'httpPut: Unexpected end of JSON input'`

### 39. [medium] Nested $ref resolution flags diamond/duplicate references as circular

[locale-loader.ts:200](src/locale/locale-loader.ts#L200) · area: eventbus-locale-util · reported severity: medium · verifier: opus

**Summary.** visitedPaths is one Set shared by every sibling and branch in a load chain, and nothing is removed when a branch finishes. Any file referenced twice in one tree, even by sibling keys, is reported as a 'Circular reference'. This blocks the 'shared common file' use case that the cache is supposed to deduplicate. Reproduced.

**Failure scenario.** root.json = {a: {$ref: 'common.json'}, b: {$ref: 'common.json'}}. load('en-US', {$ref: 'root.json'}) rejects with "Circular reference detected: common.json has already been visited (referenced from root.json)" although there is no cycle.

**Evidence.**

```ts
if (visitedPaths.has(nestedUrl)) {
          throw new Error(
            `[LocaleLoader] Circular reference detected: ${nestedUrl} has already been visited (referenced from ${parentUrl})`
          );
        }
        visitedPaths.add(nestedUrl);
```

**Fix.** Track only the ancestors of the current branch, not every node visited. In _resolveNestedRefs: check visitedPaths.has(nestedUrl), call visitedPaths.add(nestedUrl), then fetch and recurse inside try { ... } finally { visitedPaths.delete(nestedUrl); }. Keep the root URL in the set for the whole load. _fetchWithCache still dedupes the fetches. Another issue: the resolved nested object is the cached instance, and the code mutates it in place (data[key] = nestedData). A diamond therefore shares one object between both branches. Consider structuredClone of the cached data before resolving, so the cache is never mutated.

Original suggestion: Track the current ancestor path rather than all visited nodes. Add before recursing and delete after (visitedPaths.delete(nestedUrl) in a finally block), or pass a copied Set per branch.

**Verifier.** I traced the code and the report holds. LocaleLoader.load (src/locale/locale-loader.ts:53-60) creates one visitedPaths Set for the whole load chain. _loadWithVisited adds the root URL at line 79. _resolveNestedRefs (lines 188-227) then walks every key and checks visitedPaths.has(nestedUrl) at line 200. It adds the URL at line 206 and never removes it after the branch is done. Take root.json = {a:{$ref:'common.json'}, b:{$ref:'common.json'}}. Key 'a' adds common.json and resolves it. Key 'b' resolves to the same URL, finds it in the set, and throws "Circular reference detected" even though there is no cycle. The same happens when the shared file sits deeper in sibling branches (a diamond), because plain nested objects reuse the same set (lines 215-219).  Nothing guards against this. The _fetchWithCache dedup (lines 112-134) only runs after the visited check has passed. The existing tests do not cover it. T060 (spec line 155) tests a real A->B->A cycle. T061 (spec line 195) tests dedup across two locales through loadAll, which gives each locale its own Set. No test covers one file referenced twice inside a single tree.  It is reachable through the public API. src/locale/index.ts exports the LocaleLoader class, and src/index.ts:27 re-exports it, so calling `new LocaleLoader().load(...)` is a documented public call. The confirmed bug "LocaleLoader is never wired" is a different defect: the engine never calls the loader at all. This one is wrong cycle detection inside the loader, so it is not a duplicate. It does mean you can only hit it today by using LocaleLoader directly, not through an engine configuration. For that reason medium is the most it deserves. It breaks the shared-common-file pattern outright and there is no workaround.

**Repro test.** `given root.json whose sibling keys a and b both $ref common.json, when LocaleLoader.load('en-US', {$ref: 'root.json'}) is called, then it resolves with both a and b replaced by common.json data instead of rejecting with 'Circular reference detected'`

### 40. [medium] Unbound default fetch is called as a method: 'Illegal invocation' in browsers

[locale-loader.ts:141](src/locale/locale-loader.ts#L141) · area: eventbus-locale-util · reported severity: medium · verifier: opus

**Summary.** When no fetch option is given, the constructor stores globalThis.fetch in a field and calls it as this._fetch(url), so 'this' is the LocaleLoader instance. Browsers require fetch's receiver to be Window or WorkerGlobalScope and throw TypeError 'Illegal invocation'. The error is then wrapped as a load failure for every URL. Tests always inject a custom fetch, so this is never exercised.

**Failure scenario.** A consumer does new LocaleLoader({baseUrl: '/locales'}).load('en-US', {$ref: 'en.json'}) in Chrome. It rejects with "[LocaleLoader] Failed to load locale file '/locales/en.json': Failed to execute 'fetch' on 'Window': Illegal invocation".

**Evidence.**

```ts
this._fetch = options.fetch ?? globalThis.fetch;
...
      const response = await this._fetch(url);
```

**Fix.** In the constructor, bind the default fetch: `this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);`. Alternatively, store `options.fetch` and call `(this._options.fetch ?? fetch)(url)` at the call site. Add a test that stubs global fetch with `vi.stubGlobal('fetch', function (this: unknown) { if (this !== globalThis && this !== undefined) throw new TypeError('Illegal invocation'); ... })` and constructs LocaleLoader without the fetch option.

Original suggestion: Bind the default: this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis). Or call it unbound: const f = this._fetch; await f(url). Add a test that uses vi.stubGlobal('fetch', ...) with a receiver check.

**Verifier.** I traced the reported failure through the code and it holds. src/locale/locale-loader.ts:39 stores `options.fetch ?? globalThis.fetch` unbound in `this._fetch`. Line 141 then calls `await this._fetch(url)`, which runs fetch with `this` set to the LocaleLoader instance. Browsers' WebIDL fetch requires a Window or WorkerGlobalScope receiver, so in Chrome or Firefox the call throws TypeError "Illegal invocation". The surrounding try/catch wraps that error as a load failure, so every $ref load rejects.  Nothing elsewhere prevents this. LocaleLoader is public API: it is exported from src/locale/index.ts:9 and re-exported from src/index.ts:27, and constructing it without a fetch option is a documented, valid call. The tests do not cover the default path: every test in src/test/unit/locale/locale-loader.spec.ts (lines 45 and 229) injects a mock fetch. Running Vitest's jsdom setup under Node would not catch it either, because Node's undici fetch does not check its receiver.  This is a different defect from the confirmed bug "LocaleLoader is never wired" (that one is about the engine never calling the loader), so it is not a duplicate. Severity stays medium. The engine never uses LocaleLoader internally, so only consumers who use it directly without injecting fetch hit this. For those consumers, though, it breaks every load in every browser.

**Repro test.** `given LocaleLoader constructed without a fetch option and a global fetch that rejects non-global receivers, when load() is called with a $ref entry, then it resolves with the fetched locale data instead of rejecting with 'Illegal invocation'`

### 41. [medium] ActionRegistryEventbusListener shares one mutable operationData object across all actions

[actionregistry-eventbus-listener.ts:36](src/eventbus/actionregistry-eventbus-listener.ts#L36) · area: eventbus-locale-util · reported severity: medium · verifier: opus

**Summary.** A single {eventArgs} object is passed to every action registered for the event. Action.executeOperation merges operation data into it in place (Object.assign(previousOperationData, copy)), and operations add or delete properties on it. The second and later actions start from the first action's leftover state instead of a clean {eventArgs}.

**Failure scenario.** Two event actions are bound to 'timeline-play'. Action 1 runs selectElement('#a') then addClass('x'). Action 2 runs addClass('y') but forgot selectElement. Action 2 silently adds 'y' to #a, using action 1's selectedElement, instead of failing. Any 'when' checks in action 2 also see action 1's properties.

**Evidence.**

```ts
const operationData = {
        eventArgs: args,
      };
      actions.forEach(action => {
        action.start(operationData);
      });

action.ts: const mergedOperationData = Object.assign(previousOperationData, copy);
```

**Fix.** In handleEvent, give each action its own object: `actions.forEach(action => action.start({eventArgs: [...args]}));`. Also consider having Action.start shallow-copy initOperationData (`{...initOperationData}`) so no caller can share mutable state across actions. TimelineAction and other callers that pass objects have the same exposure.

Original suggestion: Create a fresh object per action: actions.forEach(action => action.start({eventArgs: [...args]})).

**Verifier.** I traced this through the real code and it holds. ActionRegistryEventbusListener.handleEvent (src/eventbus/actionregistry-eventbus-listener.ts:35-40) builds one `{eventArgs: args}` object and passes that same reference to `action.start()` for every action registered on the event. Action.start (src/action/action.ts:20-30) passes it as `previousOperationData` to executeOperation without copying it. executeOperation (action.ts:92) then runs `Object.assign(previousOperationData, copy)`, which mutates the shared object in place. Operations such as selectElement (src/operation/select-element.ts:63-75) write `operationData.selectedElement` onto that same object and return it, so the chain keeps working on the shared reference.  Two failure modes follow: 1. Leakage. Action 1 runs synchronously up to its first promise, so action 2 starts with action 1's leftover properties (selectedElement, variables and so on). A `when` check in action 2 also sees them. 2. Interleaving, which is worse. If action 1 hits an async operation after selectElement('#a'), action 2's selectElement('#b') overwrites selectedElement on the shared object. Action 1 then resumes with that same object and applies its remaining operations to #b.  Nothing guards against this. There is no deepCopy at the listener or at Action.start; deepCopy is applied only to each operation's own configured operationData. The `eventArgs` array is also shared by reference. No test covers ActionRegistryEventbusListener with multiple actions; eventbus.spec.ts only exercises generic listeners.  The trigger is a valid configuration: two eventActions with the same eventName, registered via ConfigurationResolver (configuration-resolver.ts:126) from EngineFactory. This is not a duplicate of any confirmed bug; the confirmed Eventbus entries are about handler-array iteration and once(), not operation data sharing. Medium severity fits, because it needs two or more event actions on one event and then corrupts their DOM targets.

**Repro test.** `given two event actions registered for the same event where action 1 runs selectElement('#a') and then an async operation and action 2 runs selectElement('#b'), when the event is broadcast, then each action receives a distinct operationData object and action 1's later addClass applies to #a, not #b`

### 42. [medium] Video autoplay rejection is unhandled and state stays 'active'

[video-position-source.ts:358](src/timelineproviders/position-sources/video-position-source.ts#L358) · area: timeline-providers-adapters · reported severity: medium · verifier: opus

**Summary.** startTicking calls `this._player?.play()` and discards the returned promise. Base activate() has already set the state to 'active', so when the browser blocks playback the source and the engine report 'playing' while nothing plays, and the rejection is unhandled. IPositionSource.activate documents that it throws when autoplay is blocked.

**Failure scenario.** In Chrome without user activation, engine.start() resolves. playState is 'playing' and onActivated has fired 'timeline-firstframe' (start actions run), but the video is paused and an 'Unhandled promise rejection: NotAllowedError' is logged. The next toggle calls pause() instead of retrying play.

**Evidence.**

```ts
`protected startTicking(): void { this._player?.play(); }`
types.ts: `* @throws If activation fails (e.g., autoplay blocked, permission denied)\n   */\n  activate(): Promise<void>;`
```

**Fix.** Make startTicking unable to fail silently. Override activate() in VideoPositionSource: 1. Record the previous state. 2. Set state through the base (or call super.activate() with callbacks deferred), then `await this._player.play()`. 3. If play() rejects, call stopTicking(), restore the previous state (suspended or inactive) and rethrow, so EligiusEngine.start() rejects and playState is never set to 'playing'. 4. Fire the onActivated callbacks only after play() resolves. This likely needs a protected hook in BasePositionSource, such as an async startTicking or a deferred notifyActivated(). In _handleEnded's loop branch, wrap play() in `.catch()` (or video.js's silencePromise pattern) as well.

Original suggestion: Override activate() in VideoPositionSource to await `this._player.play()`. On rejection, revert the state to its previous value and rethrow, and emit activated callbacks only after play resolves (or on the 'playing' event).

**Verifier.** The label line 358 is out of date: the file has 340 lines, and the code in question is startTicking() at src/timelineproviders/position-sources/video-position-source.ts:169-173, which runs `this._player?.play();` and throws the result away.  Traced path: 1. EligiusEngine.start() (src/eligius-engine.ts:161-166) awaits activePositionSource.activate(). 2. BasePositionSource.activate() (base-position-source.ts:110-121) sets `_state = 'active'` synchronously, calls startTicking(), then fires the onActivated callbacks right away. Nothing waits for playback to begin. 3. The installed video.js is 8.24.2. In node_modules/video.js/dist/video.es.js:23904, Player.play() returns `new Promise(resolve => this.play_(resolve))`. play_ (line 23946-23958) passes the tech's play() return value to that resolve callback through runPlayCallbacks_(val). The Html5 tech returns the native el.play() promise. A promise resolved with a rejected promise also rejects, so a NotAllowedError (autoplay blocked) rejects the promise that startTicking drops. No one catches it, so the browser reports an unhandled rejection. video.js silences these rejections only for its own internal calls (the silencePromise uses at lines 11136, 13920 and others), not for promises it hands back to callers. 4. Nothing reverts `_state`, so state stays 'active', the engine reports playing, and onActivated has already fired (firstframe and start actions run). The video stays paused. _handleTimeUpdate never fires, so the position stays frozen. The next toggle calls pause() instead of retrying play.  The IPositionSource.activate JSDoc says it throws when autoplay is blocked. This implementation never throws. The tests in src/test/unit/timelineproviders/position-sources (around lines 254 and 352) only check that play() was called with a mock, so no test covers a rejected play().  I found no guard against this. It can be triggered from a valid 'mediaplayer' configuration whenever engine.start() runs without a user gesture, for example on page load in Chrome or Safari with an unmuted video.  Not a duplicate. The confirmed 'VideoPositionSource init never settles on load error or blocked preload' is a different defect in doInit (the canplay promise never resolves). This one is about activation state and an unhandled rejection from play().  Severity stays medium. When start() is triggered by a click, which is the usual case, user activation is present and play() succeeds. The bug only shows up on autostart or other start paths without a user gesture.

**Repro test.** `given an initialized VideoPositionSource whose player.play() returns a promise rejecting with NotAllowedError, when activate() is awaited, then it rejects, state is not 'active', and onActivated callbacks were not called`

### 43. [medium] DomContainerProvider.getContainer is always undefined because nothing calls init()

[dom-container-provider.ts:107](src/timelineproviders/container-providers/dom-container-provider.ts#L107) · area: timeline-providers-adapters · reported severity: medium · verifier: opus

**Summary.** The container is resolved only in init(), which is not part of IContainerProvider, and neither EngineFactory nor EligiusEngine calls it. engine.container and the 'timeline-container-request' response are therefore always undefined for configured DOM container providers.

**Failure scenario.** The configuration has timelineProviderSettings.animation.container = {systemName: 'DomContainerProvider', selector: '#stage'}. Any operation or controller that requests 'timeline-container-request' receives undefined, and onContainerReady callbacks never fire.

**Evidence.**

```ts
`async init(): Promise<void> { ... this._container = $element; this._isReady = true; this._notifyReady(); }` ... `getContainer(): JQuery<HTMLElement> | undefined { return this._container; }`
engine-factory.ts: `return new ContainerProviderClass(options);` (no init). eligius-engine.ts: `return this._activeContainerProvider?.getContainer();`
```

**Fix.** Add `init?(): Promise<void>` and `destroy?(): void` to IContainerProvider. In EligiusEngine._initializeTimelineProvider, `await this._activeContainerProvider?.init?.()` next to the position-source init, and do the same in switchTimeline when the provider changes. Call destroy?.() on the old provider during teardown and on switch. If the API must not change, make DomContainerProvider.getContainer() look the element up lazily when _container is unset and fire the queued ready callbacks then. The interface change is the better fix, because it also fires onContainerReady at a deterministic time.

Original suggestion: Look up the element lazily in getContainer() when _container is unset (and fire ready callbacks at that point), or add `init?(): Promise<void>` to IContainerProvider and have the engine await it in _initializeTimelineProvider and switchTimeline.

**Verifier.** I traced the code and the report holds. DomContainerProvider (src/timelineproviders/container-providers/dom-container-provider.ts:70-86) sets _container and _isReady only inside init(). init() is not part of IContainerProvider (src/timelineproviders/types.ts:274-292, which declares only getContainer and onContainerReady). EngineFactory.createContainerProviderForTimeline (src/engine-factory.ts:290-301) runs `new ContainerProviderClass(options)` and never calls init(). EligiusEngine._initializeTimelineProvider (src/eligius-engine.ts:379) and switchTimeline (line 278) only assign `_activeContainerProvider`. The only init() they await is `_activePositionSource.init()` (line 401). Outside its own JSDoc example, nothing in src calls the provider's init(). So the public `engine.container` getter (eligius-engine.ts:120-122), the engine's own 'timeline-container-request' handler (line 526) and EngineEventbusAdapter's handler (engine-eventbus-adapter.ts:152-154) all return undefined, and onContainerReady callbacks queue forever. I found no guard elsewhere: the factory tests only check that getContainer is a function (engine-factory-create-timeline-providers.spec.ts:143). The provider's own unit spec calls init() by hand, which hides the gap. It is not a duplicate. No confirmed bug covers container-provider initialisation, and 'switchTimeline to another type activates an uninitialised, unwired source' is about position sources. On severity: no built-in operation or controller consumes timeline-container-request or engine.container, so the damage is limited to documented public API (`IEligiusEngine.container` and the eventbus request) used by consumer code. It fails silently on every configuration that uses DomContainerProvider, so medium is about right.

**Repro test.** `given a configuration with timelineProviderSettings.animation.container {systemName: 'DomContainerProvider', selector: '#stage'} and #stage in the DOM, when the factory-created engine has been init()-ed, then engine.container is the #stage element and the timeline-container-request response is defined`

### 44. [medium] TimelineAction without endOperations runs its start twice on a seek while playing

[eligius-engine.ts:808](src/eligius-engine.ts#L808) · area: lens-performance · reported severity: medium · verifier: opus

**Summary.** An action with no endOperations never becomes active. During seek() on an active source, positionSource.seek emits the position, _onTimeHandler runs the exact-key start methods, and then _executeSeekActions starts every non-active action covering the position again.

**Failure scenario.** A playing timeline has action {start: 5, end: 10, startOperations: [selectElement, addClass/broadcast...], endOperations: []}. engine.seek(5) runs the startOperations twice, so DOM nodes are appended twice or events broadcast twice. The same double run happens when resuming after a paused seek, because startTicking re-emits the seek position.

**Evidence.**

```ts
timeline-action.ts:26 `this._active = Boolean(this.endOperations.length);`; eligius-engine.ts:224 `await this._activePositionSource.seek(seekPosition);` (base setPosition emits when active) then :808 `const newActions = this._getActionsForPosition(position, timelineActions);` with filter `!action.active && action.duration.start <= position && action.duration.end >= position`
```

**Fix.** In EligiusEngine.seek(), set `this._lastPosition = seekPosition` before calling `this._activePositionSource.seek(seekPosition)`. The position-source emit is then ignored by _onTimeHandler, and the resume re-emit in startTicking is also skipped, so _executeSeekActions is the only dispatcher for the seek target. This covers both the playing case and the paused-then-resume case.

Original suggestion: Set this._lastPosition = seekPosition before calling positionSource.seek, so _onTimeHandler skips it. Alternatively, track 'started' separately from 'active' for actions with no endOperations, or make _executeSeekActions the only dispatcher during a seek.

**Verifier.** I traced this through the real code and it holds. src/action/timeline-action.ts:26 sets `_active = Boolean(this.endOperations.length)`, so a TimelineAction with an empty endOperations array never becomes active. In EligiusEngine.seek() (src/eligius-engine.ts:223-226), the code calls `await this._activePositionSource.seek(seekPosition)`. RafPositionSource.seek (raf-position-source.ts:123) calls setPosition. BasePositionSource.setPosition (base-position-source.ts:189-195) synchronously invokes the onPosition callbacks when the state is 'active'. That runs _onTimeHandler (eligius-engine.ts:780). _lastPosition is stale, so it differs from 5, and _executeActionsForPosition runs `_timeLineActionsLookup[uri][5]`, which is the action's start method, keyed by duration.start (line 628). Then `_executeSeekActions(5)` (line 802) calls `_getActionsForPosition`, which filters on `!action.active && start <= pos <= end`. The action is still inactive, so it starts a second time.  The paused-then-resume variant also holds. While paused, setPosition does not emit, so _executeSeekActions starts the action once. On resume, startTicking (raf-position-source.ts:89) re-emits position 5. _lastPosition is still not 5, so the lookup start fires again.  I found no guard. The engine seek tests in src/test/unit/eligius-engine.spec.ts mock positionSource.seek as `vi.fn()`, so the emit path is never exercised. Actions with an empty endOperations array are valid configuration. A start-only action, such as a broadcast or a DOM append, is a normal pattern.  This is not a duplicate. "Actions only fire when the reported position exactly equals a configured key" is a different defect, and this one needs the exact-key path to fire. "Skipped or backward positions..." concerns tick-driven dispatch, not double dispatch during a seek.  The trigger is narrow: the seek target must exactly equal the action's start key, and the action must have no endOperations. Seeking to a chapter or action start is common, though, so medium severity is fair.

**Repro test.** `given a playing RAF timeline with a TimelineAction {start: 5, end: 10} that has startOperations and empty endOperations, when engine.seek(5) is called, then the action's startOperations run exactly once`

### 45. [medium] timeline-duration broadcasts an unbound getDuration method

[eligius-engine.ts:421](src/eligius-engine.ts#L421) · area: lens-performance · reported severity: medium · verifier: opus

**Summary.** The event contract is a function that returns the duration, but the engine passes the class method unbound. Calling it throws because `this` is undefined.

**Failure scenario.** A consumer subscribes with eventbus.on('timeline-duration', getDuration => getDuration?.()). On the first frame it throws TypeError: Cannot read properties of undefined (reading '_duration'). EngineEventbusAdapter also broadcasts a correct `() => duration` for the same frame, so listeners get two events, one of which throws.

**Evidence.**

```ts
`this.eventbus.broadcast('timeline-duration', [ this._activePositionSource?.getDuration, ]);` (also line 291-293); base-position-source.ts `getDuration(): number { return this._duration; }`
```

**Fix.** In eligius-engine.ts at lines 291-293 and 421-423, pass a bound closure instead of the bare method reference: `const source = this._activePositionSource; this.eventbus.broadcast('timeline-duration', [source ? () => source.getDuration() : undefined]);`. Do not leave both the engine and EngineEventbusAdapter broadcasting this event. Either drop the engine-side broadcast and rely on the adapter's `() => duration`, which also removes the double event, or keep the engine's version and remove the adapter's. Update the test at src/test/unit/eligius-engine.spec.ts:1054 so it calls the broadcast argument and asserts the result, rather than checking reference identity.

Original suggestion: Broadcast `() => source.getDuration()` (bound), or drop the engine broadcast and rely on the adapter's version.

**Verifier.** I traced this through the real code and found nothing that prevents it. In F:\projects\eligius\eligius\src\eligius-engine.ts, _onFirstFrameCallback (lines 421-423) broadcasts 'timeline-duration' with `this._activePositionSource?.getDuration`. The same thing happens in switchTimeline at lines 291-293. In both places the method reference is passed without being bound. getDuration is a prototype method that depends on `this`: BasePositionSource.getDuration returns `this._duration` (base-position-source.ts:158) and VideoPositionSource.getDuration returns `this._player?.duration()` (video-position-source.ts:237). ES classes run in strict mode, so a consumer that calls the function it receives runs with `this` undefined and gets a TypeError. The public event contract in src/eventbus/events/timeline-duration.ts:8 is `args: [getDuration: (() => number) | undefined]`, documented as "Function that returns the timeline duration", so calling it is the documented way to use it. No code binds the method or wraps it in an arrow function. The engine test at src/test/unit/eligius-engine.spec.ts:1054-1067 only checks the reference passed, using a vi.fn mock that does not use `this`, so it does not catch the problem. Nothing inside the engine subscribes to 'timeline-duration'. ProgressbarController uses 'timeline-duration-request' instead, so the engine's own features still work. EngineEventbusAdapter (engine-eventbus-adapter.ts:63) also broadcasts a correct `() => duration`. As a result, a listener on a factory-built engine receives one working broadcast and one that throws. This is not the same root cause as the confirmed "Engine and EngineEventbusAdapter both handle eventbus commands and broadcast events". That bug is duplicated wiring, while this one is a broken callback value that would still be wrong if the adapter were removed. Even so, removing the engine-side broadcast would fix both. I rated it medium: it fires on every timeline's first frame from any valid configuration and breaks a documented public event for external subscribers, but no built-in feature depends on it.

**Repro test.** `given an engine with a real RafPositionSource of duration 10, when the first frame fires and a listener calls the getDuration argument of the 'timeline-duration' broadcast, then it returns 10 instead of throwing a TypeError`

### 46. [medium] Metadata generator emits enum-of-strings for optional props (`key?: string` -> 'string')

[metadata-generator.ts:395](src/tools/code-generator/metadata-generator.ts#L395) · area: configuration-tools · reported severity: medium · verifier: opus

**Summary.** With strictNullChecks, property.getType() for an optional property is `T | undefined`, a union. The union branch emits every member's text as a literal value. Optional strings get the type values 'undefined' and 'string', and optional booleans get 'undefined','false','true', instead of ParameterType:string/boolean. 28 generated operation metadata files are affected. The same code exists in ctrls-metadata-generator.ts:369.

**Failure scenario.** clear-storage.ts `key?: string` generates `key: {type: [{value:'undefined'},{value:'string'}]}`. animate-with-class `removeClass?: boolean` generates the enum undefined/false/true. Editors built on the metadata then offer the literal strings 'undefined' and 'string' as choices.

**Evidence.**

```ts
if (type.isUnion() && propType !== 'boolean') {
  const unionValues = type
    .getUnionTypes()
    .map(u => u.getLiteralValue() ?? u.getText());
```

**Fix.** In getTypeFromProperty (metadata-generator.ts and the controllers metadata generator), first set `const t = property.hasQuestionToken() ? type.getNonNullableType() : type;` and use t for both propType and the union check. Then treat t as an enum only when t.isUnion() and every member is a literal (u.isLiteral() or u.isBooleanLiteral()). Map a pure `true | false` union to ParameterType:boolean, and map any other non-literal type through the existing ParameterType:<type> path. Apply the same non-nullable stripping to the type-parameter constraint branch. Then regenerate with npm run metadata.

Original suggestion: Strip undefined/null from the union first (type.getNonNullableType()). Treat a union only as an enum when every remaining member is a literal; otherwise map the non-literal type to ParameterType:<type>.

**Verifier.** I traced this through the real code and the generated output. tsconfig.json:24 sets "strict": true, and metadata-generator.ts:52 builds the ts-morph Project from that tsconfig. That makes strictNullChecks active, so property.getType() for an optional property such as `key?: string` returns the union `string | undefined`. At metadata-generator.ts:394-395, propType is type.getText(), here "string | undefined". It is not equal to 'boolean', so the union branch runs and emits each member's getText() as a literal enum value. The checked-in output shows the defect directly. src/operation/metadata/clear-storage.ts has `key: {type: [{value:'undefined'},{value:'string'}]}`, and src/operation/metadata/animate-with-class.ts has `removeClass` as undefined/false/true. 28 operation metadata files contain `value: 'undefined'`. Controller metadata has the same pattern (label-controller.ts:21, mutation-observer-controller.ts:20,27), so the controllers generator shares the defect. Nothing strips undefined before this branch. The `propType !== 'boolean'` guard only works for a non-optional boolean, because an optional boolean's text is "boolean | undefined". No test covers the generators; coverage excludes src/tools. I checked for duplicates: the confirmed schema-generator bugs (skipped operations, @dependency marked required) are different defects in a different generator, so this is not a duplicate. Severity: runtime engine behaviour is unaffected. The damage is to the published metadata entry (dist/metadata.mjs), which editors and the Eligian DSL use for parameter types and completions. Every optional string, boolean or number parameter is misdescribed as an enum that contains the literal 'undefined' and the type name. Medium fits.

**Repro test.** `given an operation data interface with optional property `key?: string`, when the operation metadata generator runs, then key.type is 'ParameterType:string' and not an enum containing 'undefined'`

### 47. [medium] ActionCreator.getConfiguration detaches the creator from the factory config

[action-creator-factory.ts:149](src/configuration/api/action-creator-factory.ts#L149) · area: configuration-tools · reported severity: medium · verifier: opus

**Summary.** The creator's actionConfig object is pushed into the factory's collection when the creator is created. getConfiguration replaces this.actionConfig with the callback's return value. Neither the callback's change nor any later addStartOperation/addEndOperation/addDuration reaches the factory.

**Failure scenario.** const c = f.createAction('A'); c.getConfiguration(x => ({...x, name:'C'})); c.addStartOperation('selectElement',{selector:'#y'}); f.getConfiguration().actions[0] -> name 'A', 0 startOperations (verified).

**Evidence.**

```ts
const copy = deepCopy(this.actionConfig);
const newConfig = callBack.call(this, copy);
if (newConfig) {
  this.actionConfig = newConfig;
}
```

**Fix.** In ActionCreator.getConfiguration, keep the shared reference. If the callback returns a config, copy it into the existing object rather than reassigning: `for (const k of Object.keys(this.actionConfig)) delete (this.actionConfig as any)[k]; Object.assign(this.actionConfig, newConfig);`. Alternatively, make getConfiguration read-only and add an explicit setter that does the same in-place copy. Apply the same in-place approach to ActionEditor.getConfiguration.

Original suggestion: Object.assign the returned config onto the existing actionConfig, or replace the entry in the factory collection by id.

**Verifier.** I traced this through the real code and it holds.  1. `ActionCreatorFactory.createAction` (src/configuration/api/action-creator-factory.ts:31-35) passes `creator.actionConfig` to `ConfigurationFactory.addAction`. `_internalAddAction` (configuration-factory.ts:307-316) pushes that object by reference. `addTimelineAction` (line 372) and `addEventAction` do the same. 2. `ActionCreator.getConfiguration` (action-creator-factory.ts:145-151) deep-copies `actionConfig`, passes the copy to the callback, and assigns any truthy return value to `this.actionConfig`. 3. From then on, `setName`, `addStartOperation` (it pushes onto `this.actionConfig.startOperations`) and the subclass mutators only change the detached object. The factory still holds the original.  It is worse than the report says. The usual read-only idiom, `getConfiguration(c => (config = c))` (used throughout action-editor.spec.ts, e.g. line 37), returns the copy, because an assignment expression evaluates to the assigned value. So simply reading the config detaches the creator. No guard re-syncs it: nothing writes `actionConfig` back into the factory collection by id. No test covers `ActionCreator.getConfiguration` followed by further edits.  **Not a duplicate.** The confirmed bug "Action editors copy the action, so edits never reach the factory configuration" is in action-editor.ts and comes from the editor copying the action up front. This defect is in `ActionCreator`, which correctly starts with a shared reference and loses it only in `getConfiguration`. The same pattern also exists in `ActionEditor.getConfiguration` (action-editor.ts:52), but the root cause in this class is separate.  **Severity: medium.** It silently drops configuration from the documented fluent API, but only when `getConfiguration` is called on a creator before further edits. Runtime JSON configurations are not affected.

**Repro test.** `given an action created via ConfigurationFactory.createAction, when getConfiguration(c => (cfg = c)) is called and then addStartOperation('selectElement', {selector: '#y'}) is added, then factory.getConfiguration().actions[0].startOperations has length 1`

### 48. [medium] Skipped or backward positions leave actions un-started, un-ended or ended twice

[eligius-engine.ts:780](src/eligius-engine.ts#L780) · area: engine-core · reported severity: medium · verifier: sonnet

**Summary.** _onTimeHandler assumes positions advance one key at a time. Any jump (a throttled RAF tick in a background tab, a video timeupdate every ~250ms, a large keyboard step) skips the start and end methods of every key in between. Backward movement (KeyboardStepSource step back, scrolling up) runs whatever is keyed at the new position, start and end, and never reverses actions whose ranges were left. TimelineAction.end does not check `active`, so revisiting an end key re-runs endOperations on an action that has already ended.

**Failure scenario.** KeyboardStepSource with step 1, actions A=[2,5] and B=[5,8]. Step forward 0..6: A ends at 5, B starts at 5. Step back to 5: actions[5] runs A.end() again (endOperations such as removeElement run on already-removed DOM) and B.start() is skipped because B is active. Step back to 4: nothing is keyed at 4, so B stays active outside its range and A is not restarted. Similarly, a RAF tick going from 0.3 to 1.3 with tickInterval 100 skips everything keyed at 0.4 to 1.2.

**Evidence.**

```ts
if (this._lastPosition !== pos) {
        this._executeActionsForPosition(pos);
...
  end(initOperationData: TOperationData): Promise<TOperationData> {
    return super.end(initOperationData).then(result => {
```

**Fix.** In _onTimeHandler, when pos < _lastPosition or pos - _lastPosition exceeds one tick interval, call `_executeSeekActions(pos)` instead of the exact-key lookup. Keep the exact-key path for normal forward single steps. Separately, make TimelineAction.end a no-op (return Promise.resolve({})) when !active, so a repeated end key does not re-run endOperations. Note that actions with no endOperations never become active (`_active = Boolean(endOperations.length)`), so the guard must not suppress end for them. The reconciliation also needs to handle that case without double-starting.

Original suggestion: When |pos - lastPosition| is larger than one tick, or pos < lastPosition, run the existing _executeSeekActions(pos) reconciliation instead of the exact-key lookup. Make TimelineAction.end a no-op when !active.

**Verifier.** I found no guard or invariant that prevents this. In src/eligius-engine.ts, _onTimeHandler (line 780) uses an identity floor and only checks `_lastPosition !== pos`. It then calls _executeActionsForPosition, which runs only `lookup[uri][pos]`, the actions keyed at that exact position. There is no range reconciliation and no direction check. _executeSeekActions (the reconciliation that ends actions outside the range and starts those inside) is called only from seek() (line 226) and from the timeline switch (line 300). It is never called from the position callback.  Position sources emit jumps and backward moves through BasePositionSource.setPosition, which calls the position callbacks directly. KeyboardStepSource._handleStepBackward calls setPosition(current - step) with no other signal to the engine. RafPositionSource._onTick computes `floor(elapsed/tickInterval)` and emits that one position. If a tick is delayed, every key in between is skipped.  TimelineAction.end (src/action/timeline-action.ts lines 33-38) has no `active` check. It always calls super.end and then sets `_active = false`. TimelineAction.start is guarded by `active`, so a second start is a no-op while the action is active. That matches the claim exactly: revisiting an end key re-runs endOperations, and revisiting a start key while active is skipped.  The step-back scenario holds. With A=[2,5] and B=[5,8], stepping forward to 5 runs A.end and B.start. Stepping back to 5 runs the keyed A.end again and B.start is a no-op. Stepping back to 4 runs nothing, so B stays active outside its range and A is not restarted.  I did not run a repro test. I found no existing test covering skip or backward behaviour in the position handler. The grep of the integration and unit tests only matched for-each-loop. The impact is real but limited to non-RAF-regular sources: keyboard, scroll, video timeupdate, and throttled ticks. Seeking through engine.seek() is handled correctly. So severity is medium, not high.

**Repro test.** `given KeyboardStepSource-like position callbacks and timeline actions A=[2,5] and B=[5,8] with endOperations, when position advances 0..6 and then steps back to 5 and then 4, then A.endOperations run only once and B is ended and not left active at position 4`

### 49. [medium] stop() resets the source to 0 but leaves active actions running and _lastPosition stale

[eligius-engine.ts:187](src/eligius-engine.ts#L187) · area: engine-core · reported severity: medium · verifier: sonnet

**Summary.** stop() is documented as 'Stop playback and reset to beginning'. It only deactivates the source (position set to 0). Active timeline actions are not ended and _lastPosition is not reset. When playback restarts, actions that were active at stop time stay active (their start is skipped by the active guard) until their end key is reached again.

**Failure scenario.** Action [3,8] with endOperations, playing at 5, stop(), start(): the position restarts at 0, but the action's DOM from the previous run stays visible during 0-3. At 3 its start is skipped (active), so it is never re-initialised, and it only ends at 8.

**Evidence.**

```ts
stop(): void {
    if (!this._activePositionSource) {
      return;
    }

    this._activePositionSource.deactivate();
    this._emitter.emit('stop');
```

**Fix.** Make stop() async. Call deactivate(), then await this._cleanUpTimeline() so active actions run their end operations, then set this._lastPosition = -1, and then emit 'stop'. The callers (_stopRequest and the adapter) need to await or catch errors. The alternative is to keep stop() synchronous and fire-and-forget the cleanup with a catch, which has an ordering risk against a quick start().

Original suggestion: In stop(), await _cleanUpTimeline() (stop should become async, or chain the call and handle errors) and set _lastPosition = -1.

**Verifier.** I traced the scenario through the real code. stop() (eligius-engine.ts:187) only calls _activePositionSource.deactivate(), emits 'stop' and broadcasts 'timeline-stop'. BasePositionSource.deactivate() sets state to inactive and position to 0. Nothing else cleans up on stop. The adapter and eventbus handlers only forward the event, and _stopRequest just calls stop(). _cleanUpTimeline() is called only from switchTimeline, from the timelineComplete handler (_handleTimelineComplete) and from the teardown path near line 432, never from stop(). _lastPosition is reset only in switchTimeline, so it stays at the last executed position.  TimelineAction.start() returns early when _active is true. _active is true for any action with endOperations, and it is cleared only in end(). For action [3,8] with endOperations, playing at 5 means it is active. After stop() and start(), the source ticks from 0 and _onTimeHandler runs the actions registered at each position, since 0 differs from the stale _lastPosition. Position 3 calls the bound start(), which is skipped because the action is still active. Its previous DOM therefore stays visible from 0 to 3 and is never re-initialised. It ends only when position 8 is reached. The failure scenario holds.  I found no guard or test against it. The existing stop() tests only check deactivation, the playState and the emitted event.  The stale _lastPosition part is minor. If playback stopped exactly at the last-run position, for example 0, the first frame at that position would be suppressed. The active-actions leak is the real defect. Stop followed by start is a normal user flow, so this is reachable from a valid configuration. The impact is a visual or state inconsistency, not a crash, so medium is slightly generous. I put it at low to medium; I'm keeping medium because it is user-visible on a common flow.

**Repro test.** `given a timeline action [3,8] with endOperations that is active at position 5, when stop() is called and then start() ticks the source through position 3, then the action's endOperations have run on stop and its startOperations run again at 3 (today they do not, because action.active is still true)`

### 50. [medium] switchTimeline(uri, pos) resolves early, stays suspended, ignores pos when looping

[eligius-engine.ts:284](src/eligius-engine.ts#L284) · area: engine-core · reported severity: medium · verifier: sonnet

**Summary.** The position>0 path does its work in an async eventbus.once('timeline-firstframe') handler. The eventbus does not await that handler, so switchTimeline's promise resolves while _executeStartActions and seek are still pending, and any rejection becomes unhandled. The handler suspends the source and never resumes it. For loop:true timelines the else branch is taken and `position` is silently dropped.

**Failure scenario.** `await engine.switchTimeline('t2', 5); engine.position`: with VideoPositionSource (seek waits for 'seeked') this returns 0, not 5, and playState is 'paused' although the caller asked for a switch. switchTimeline('loopingTl', 5) starts at 0. The firstframe handler also calls _executeStartActions after position-0 actions have already run via RAF's initial setPosition(0), so start-only actions at 0 run twice.

**Evidence.**

```ts
if (!this._activePositionSource.loop && position > 0) {
      this.eventbus.once('timeline-firstframe', async () => {
...
        this._activePositionSource.suspend();
...
        await this._executeSeekActions(position);
      });
    } else {
```

**Fix.** Do the work inline instead of in the eventbus.once handler: 1. Deactivate the source, clean up and configure the new timeline. 2. Run _executeStartActions and `await engine.seek(position)` (or source.seek followed by _executeSeekActions) for every timeline, loop or not. Clamp position to the duration. 3. Then activate() the source, unless the caller explicitly wants a paused switch. 4. Fix the uncalled `getDuration` in the 'timeline-duration' broadcast. 5. Update the 'double-seek' test to await switchTimeline and assert the final position and state. Add a loop:true case.

Original suggestion: Do the work inline: deactivate, clean up, configure, then await seek(position) followed by _executeSeekActions(position) before activate(). Drop the eventbus.once indirection and the loop special case, and decide explicitly whether the switched timeline should play or pause.

**Verifier.** I traced switchTimeline (src/eligius-engine.ts 253-323) through BaseSource.activate and RafPositionSource.  1. Early resolve. activate() sets state 'active', calls startTicking(), then runs the activated callbacks synchronously. _onFirstFrameCallback broadcasts 'timeline-firstframe', and the once-handler starts. The handler runs synchronously up to its first await (suspend, broadcast, then `await this._executeStartActions()`). The eventbus does not await it, so activate() returns and switchTimeline resolves while _executeStartActions, seek and _executeSeekActions are still pending. Any rejection from them is unhandled.  2. Stays suspended. The handler calls `this._activePositionSource.suspend()` and nothing resumes it. It calls source.seek() directly, not engine.seek(), and only engine.seek() reactivates an active source. So after switchTimeline(uri, 5) on a non-loop timeline, the source is 'suspended' and the timeline does not play. Nothing in the code or tests marks this as intended. The comment above activate() says the switched timeline should 'actually play'.  3. Loop drops position. `if (!loop && position > 0)` sends loop:true timelines to the else branch. That branch only resets _lastPosition, so `position` is ignored. This is reachable from request-timeline-uri (engine-eventbus-adapter.ts:139) and from the call at line 712.  4. The existing tests do not cover this. The 'double-seek' test calls the captured once-callback by hand and only checks the seek call count. The other switchTimeline tests use position 0.  Two parts of the report are weaker than stated: - The 'start-only actions at 0 run twice' claim is mostly guarded. _getActionsForPosition filters on `!action.active`, so a start action that has already run is not started again. At worst it is a race. - The 'position stays 0' symptom needs a source whose seek is genuinely async, such as VideoPositionSource. RafPositionSource.seek is effectively synchronous, so there the window is a microtask.  Separately, `getDuration` is passed uncalled in the 'timeline-duration' broadcast at lines 292 and 422. That is a minor extra bug.  Severity: medium. The three defects hold, they are reachable from a valid configuration (a navigation request that carries a position), and the effect is a timeline that does not play.

**Repro test.** `given a non-looping timeline-2 and a started engine, when switchTimeline('timeline-2', 5) is awaited, then the position source is 'active' and seek(5) plus seek actions have completed (currently the source is 'suspended' and the handler is still pending); and given a loop:true timeline, when switchTimeline(uri, 5) is awaited, then source.seek is called with 5 (currently it is never called)`

### 51. [medium] Concurrent start()/end() on the same Action share and overwrite one scope stack

[action.ts:38](src/action/action.ts#L38) · area: engine-core · reported severity: medium · verifier: opus

**Summary.** _scopeStack is an instance field that start() and end() both reset with _initializeScopeStack(). executeOperation reads `this._scopeStack[this._scopeStack.length - 1]` at every step. If an action's start chain is still awaiting an async operation when end() (or a second start()) runs, the in-flight chain continues on the other execution's scope: wrong currentIndex/newIndex/operations, broken when/forEach jumps.

**Failure scenario.** TimelineAction [0,1] whose startOperations are [animate (1.5s promise), when, ..., endWhen] and which has endOperations. The engine does not await action promises, so at 1s it calls end(), which replaces _scopeStack with an end scope. When the animation resolves, the start chain's `when` pushes onto the end scope, and its newIndex/currentIndex writes go to the end execution, so start and end operations are skipped or repeated. Duplicate event dispatch (first finding) makes concurrent start() on event actions routine.

**Evidence.**

```ts
protected _initializeScopeStack() {
    this._scopeStack = [
      {
        currentIndex: -1,
        eventbus: this.eventbus,
        operations: this.startOperations,
...
    let scope = this._scopeStack[this._scopeStack.length - 1];
```

**Fix.** Make the scope stack belong to one execution instead of the instance. start()/end() should build a local stack (e.g. `const stack = [{currentIndex: -1, eventbus, operations: <the operations being run>}]`) and pass it through executeOperation, _pushScope and _popScope as a parameter. The initial scope's `operations` should then be the array being executed (endOperations for end()), not always startOperations.

Original suggestion: Create the scope stack per execution (a local passed through executeOperation, or a small execution-context object) instead of storing it on the instance.

**Verifier.** I traced the reported failure through the code and it holds. Action._scopeStack is one instance field (src/action/action.ts:12). Both Action.start (line 21) and EndableAction.end (src/action/endable-action.ts:21) replace it through _initializeScopeStack. executeOperation does not get its scope as a parameter. It reads this._scopeStack[length-1] again on every step (action.ts:79), including the steps resumed from a promise's .then (lines 118-127). That means a start chain resuming after an async operation picks up whichever stack the most recent start()/end() put there.  Nothing serialises the two calls. The engine's tick handler fires end/start methods without awaiting them (src/eligius-engine.ts:798, `executions?.forEach(exec => exec())`). TimelineAction.start only blocks a second start while `_active` is true (timeline-action.ts:25). It does nothing to stop end() from running while start is still in flight. ActionRegistryEventbusListener.handleEvent (src/eventbus/actionregistry-eventbus-listener.ts:39) also calls action.start() without awaiting, so a second event can restart an event action that is still running.  Example with a valid configuration: a TimelineAction with duration [0,1], startOperations [wait {milliseconds:1500}, when, ..., otherwise, ..., endWhen], and any endOperations. At position 1, end() resets the stack. The start chain then resumes on the end execution's scope, so its when/endWhen push and pop on that stack and its currentIndex/newIndex writes land there too. The result is skipped or repeated operations in both chains. A purely linear chain mostly survives, because the operations array is passed explicitly. The damage needs control flow (when/forEach/newIndex) together with an async operation that overlaps a second execution, which is why I kept severity at medium rather than high.  No test in src/test/unit/action covers overlapping executions. A side note: _initializeScopeStack always sets scope.operations = this.startOperations, even when it is called from end(). That is a separate small defect.  This is not a duplicate. None of the confirmed bugs is about the shared per-instance scope stack. The confirmed "Recursive executeOperation overflows the stack" is about recursion depth, which is a different defect.

**Repro test.** `given a TimelineAction whose start chain awaits a pending promise before a when/endWhen block, when end() runs before that promise resolves, then the start chain still evaluates its when block on its own scope and runs the correct branch`

### 52. [medium] EngineInputAdapter's space unbind misses when another hotkeys scope is active

[engine-input-adapter.ts:52](src/adapters/engine-input-adapter.ts#L52) · area: lens-lifecycle-memory · reported severity: medium · verifier: opus

**Summary.** The space handler is registered in hotkeys' default 'all' scope. The remover calls hotkeys.unbind('space', handler) without a scope, and hotkeys-js 4.x then uses getScope(), the current scope. KeyboardStepSource._bindKeys calls hotkeys.setScope(scopeId) while active, and factory destroy() disconnects the input adapter before engine.destroy() stops the keyboard source. The unbind therefore looks in the wrong scope and the global space handler is never removed.

**Failure scenario.** Use a KeyboardStepSource timeline, call engine.start() so the source sets the hotkeys scope, then call factory result destroy(). The unbind targets scope 'keyboard-step-source-<uuid>', but the record's scope is 'all', so nothing is removed. Every later space press still runs _handleSpacePress on the destroyed engine, calls preventDefault (blocking page scrolling on space), and keeps the whole engine graph reachable.

**Evidence.**

```ts
engine-input-adapter.ts:
    hotkeys('space', handleSpaceBound);
    this._removers.push(() => hotkeys.unbind('space', handleSpaceBound));

keyboard-step-source.ts:249:
    hotkeys.setScope(this._scopeId);

hotkeys-js eachUnbind:
    if (!scope) scope = getScope();
    ... const isUnbind = isMatchingMethod && record.scope === scope && ...
```

**Fix.** Unbind with an explicit scope that matches the registration: `this._removers.push(() => hotkeys.unbind('space', 'all', handleSpaceBound));`. Also make the hotkeys mock in engine-input-adapter.spec.ts track scope, so the test covers this. Reordering the factory destroy is not enough by itself: any other scope that is active at disconnect time would trigger the same leak.

Original suggestion: Unbind with an explicit scope: `hotkeys.unbind('space', 'all', handleSpaceBound)`. Also consider disconnecting EngineInputAdapter after engine.destroy().

**Verifier.** I traced this through the real code and the installed hotkeys-js 4.0.8 (node_modules/hotkeys-js/dist/hotkeys-js.js), and it holds.  - **The bind and the unbind use different scopes.** src/adapters/engine-input-adapter.ts:51 registers `hotkeys('space', handler)` with no scope, so the handler goes into the 'all' scope (hotkeys-js.js:430). Line 52 then unbinds with `hotkeys.unbind('space', handler)`. In hotkeys-js.js:290-299 that call sets scope to '', and `eachUnbind` (hotkeys-js.js:315) replaces it with `getScope()`. Its filter only removes records where `record.scope === scope` (line 320). - **The keyboard source changes the current scope while it runs.** KeyboardStepSource.startTicking calls `_bindKeys`, which calls `hotkeys.setScope(this._scopeId)` (keyboard-step-source.ts:249). The scope only goes back to 'all' in `stopTicking` or `doDestroy`, through `deleteScope` (hotkeys-js.js:252). - **The factory disconnects the adapter first.** The factory `destroy()` (src/engine-factory.ts:226-233) calls `engineInputAdapter.disconnect()` before `engineInstance.destroy()`. - **Result.** Destroy while a keyboard-source timeline is ticking (playing) and the current scope is still 'keyboard-step-source-<uuid>'. The unbind then matches nothing, because the record's scope is 'all', and the global space handler stays registered. `eventHandler` (hotkeys-js.js:332) fires handlers in the 'all' scope under any scope. So every later space press calls `preventDefault` and `engine.start()` on the destroyed engine, and the closure keeps the engine graph reachable.  **It comes from a valid configuration.** KeyboardStepSource is exported from src/timelineproviders/index.ts:25. EligiusResourceImporter imports that module, so a `timelineProviderSettings` `systemName` of 'KeyboardStepSource' resolves through `createPositionSourceForTimeline`.  **The existing tests do not catch it.** src/test/unit/adapters/engine-input-adapter.spec.ts mocks hotkeys with an `unbind(key)` that ignores scope, so it cannot see this.  **Not a duplicate.** The confirmed list has no hotkeys-scope bug. "Factory destroy() disconnects adapters before end ops run" is about the same ordering, but its defect is end operations that break `selectElement`. The root cause here is the unscoped unbind, which would still fail with any adapter or engine order as long as another scope is active when it runs.  **Severity: medium.** It only happens with a KeyboardStepSource timeline destroyed while playing. When paused or stopped, `stopTicking` has already reset the scope to 'all', so the unbind works. When it does happen, it leaks the engine and blocks space-scrolling on the whole page.

**Repro test.** `given a space hotkey registered by EngineInputAdapter and the hotkeys scope set to a KeyboardStepSource scope, when the adapter is disconnected, then pressing space no longer calls engine.start or engine.pause`

### 53. [medium] Container providers are never init()ed or destroyed; engine.container is always undefined

[eligius-engine.ts:379](src/eligius-engine.ts#L379) · area: lens-lifecycle-memory · reported severity: medium · verifier: opus

**Summary.** EngineFactory constructs a DomContainerProvider per timeline type, and the engine stores it as _activeContainerProvider. Nothing ever calls its init(), so _container is never set. Nothing calls destroy() either, so its ready callbacks are never released.

**Failure scenario.** With the default DomContainerProvider from TimelineProviderSettingsEditor, eventbus.request('timeline-container-request') and engine.container both return undefined for the whole engine lifetime. Callbacks passed to onContainerReady never fire.

**Evidence.**

```ts
eligius-engine.ts:
    this._activeContainerProvider = providerSettings.containerProvider;
...
  get container(): JQuery<HTMLElement> | undefined {
    return this._activeContainerProvider?.getContainer();
  }

dom-container-provider.ts:
  async init(): Promise<void> {
    ...
    this._container = $element;
    this._isReady = true;

  getContainer(): JQuery<HTMLElement> | undefined {
    return this._container;
  }
```

**Fix.** Add optional `init?(): Promise<void>` and `destroy?(): void` to IContainerProvider (and IPlaylist). In EligiusEngine._initializeTimelineProvider, call `await this._activeContainerProvider?.init?.()` next to positionSource.init(). Do the same in switchTimeline when the provider changes. In engine destroy, and before replacing the provider, call `this._activeContainerProvider?.destroy?.()`. Skip init/destroy when the container provider is the same object as the position source (VideoPositionSource implements both), so it is not initialised twice.

Original suggestion: Add optional init()/destroy() to IContainerProvider and IPlaylist. Have the engine await containerProvider.init() alongside positionSource.init(), and call destroy() on each provider in engine.destroy().

**Verifier.** I traced this through the real code and it holds.  1. EngineFactory.createContainerProviderForTimeline (src/engine-factory.ts:290-300) builds `new ContainerProviderClass(options)` and never calls `init()`. DomContainerProvider resolves through EligiusResourceImporter because it is exported from src/timelineproviders/index.ts:41. TimelineProviderSettingsEditor.setContainer() picks DomContainerProvider by default (timeline-provider-settings-editor.ts:23,140). 2. EligiusEngine._initializeTimelineProvider stores the provider at eligius-engine.ts:379, and switchTimeline stores it at :278. The engine only awaits `this._activePositionSource.init()` (:401) and never initialises the container provider. At :453 it sets `_activeContainerProvider = undefined` without calling destroy(). 3. Nothing in src/ outside the class calls DomContainerProvider.init(). I grepped all `containerProvider` and `.init()` uses outside tests. The provider's `_container` is only set in init() (dom-container-provider.ts:69-85), so getContainer() returns undefined for the life of the engine. 4. As a result, `engine.container` (eligius-engine.ts:120), the engine's own `timeline-container-request` handler (:526/:553) and EngineEventbusAdapter's handler (engine-eventbus-adapter.ts:152) all return undefined for any valid configuration with a DomContainerProvider. onContainerReady callbacks never fire, and destroy() is never called. 5. No test catches this. The unit and smoke tests (eligius-engine.spec.ts:228, engine-smoke.spec.ts:128) inject mock container providers whose getContainer returns a preset element, so the missing init() is never exercised.  This is not a duplicate. None of the confirmed bugs cover the container-provider lifecycle. The confirmed duplicate-wiring bug is about play-toggle and command handlers, which is a different defect.  The impact is limited. Nothing inside the library uses `engine.container` or `timeline-container-request` except to return it, so the core timeline and actions keep working. The breakage is in a documented public getter and eventbus request, and the leak is small (a callback array). Medium severity is about right.

**Repro test.** `given a factory-built engine whose timeline settings use DomContainerProvider with an existing selector, when engine.init() resolves, then engine.container is the jQuery element for that selector (fails today: undefined)`

### 54. [low] Property chains reach Function constructor; invokeObjectMethod then runs config code

[get-property-chain-value.ts:52](src/operation/helper/get-property-chain-value.ts#L52) · area: lens-security-robustness · reported severity: critical · verifier: sonnet

**Summary.** getPropertyChainValue walks inherited properties without restriction, so '$operationdata.<anyKey>.constructor.constructor' resolves to Function. invokeObjectMethod calls any method on any instance. Chained, a JSON configuration can build and run arbitrary JavaScript, which breaks the 'never execute arbitrary code from configuration' rule.

**Failure scenario.** Operations: setOperationData {x:'s', properties:{instance:'$operationdata.x.constructor.constructor'}} -> instance === Function; invokeObjectMethod {methodName:'call', methodArguments:[null,'return 42']} -> methodResult is a new function; setOperationData {instance:'$operationdata.methodResult'}; invokeObjectMethod {methodName:'call'} -> returns 42. Verified with a temporary spec; replacing 'return 42' with any script body executes it.

**Evidence.**

```ts
return currentInstance[prop];
// invoke-object-method.ts:46
const func = operationData.instance[methodName];
  if (typeof func === 'function') {
    newOperationData.methodResult = func.apply(
      operationData.instance,
      methodArguments ?? []
    );
```

**Fix.** In getPropertyChainValue, refuse the segments `__proto__`, `constructor` and `prototype`, and read only own properties. Arrays still work, since indices and `length` are own properties. Own-property checks may break reads of inherited members on class instances, such as getters on controllers, so a blocklist of those three keys is the safer minimal fix. Optionally, in invokeObjectMethod, refuse `instance === Function` and the method names `constructor`, `call`, `apply` and `bind` on function instances.

Original suggestion: Block 'constructor', '__proto__' and 'prototype' segments in getPropertyChainValue and allow only own properties (Object.hasOwn). In invokeObjectMethod, refuse methodName values 'constructor', 'call', 'apply' and 'bind', and refuse when instance is a Function, or keep an allow-list.

**Verifier.** I traced the chain through the real code and the mechanism holds. There is no guard.  - `getPropertyChainValue` (src/operation/helper/get-property-chain-value.ts:52) does `currentInstance[prop]` with no own-property check and no blocklist. It only rejects falsy intermediates. - `resolveExternalPropertyChain` sends `$operationdata.*` and `$globaldata.*` straight into it. `$scope.*` goes through `getScopeChainValue`, which also ends in it. The only filter there is `head in scope`, which does not block `constructor` on `$scope` either. - `setOperationData` calls `resolvePropertyValues`, which calls `resolveExternalPropertyChain` for any string that `isExternalProperty` accepts. So `'$operationdata.constructor.constructor'` resolves to the global `Function`. - `invokeObjectMethod` (invoke-object-method.ts:46-51) runs `instance[methodName]` with `func.apply(instance, methodArguments)` and no restrictions. `Function.call(Function, null, 'alert(1)')` builds a function, and a second `call` runs it. The scenario works as described. - I found no guards, no tests asserting that such chains are rejected, and no documentation saying this is intended.  It is still not a high-severity vulnerability, for three reasons: - Eligius configurations are author-supplied code-equivalent. They already drive arbitrary DOM operations, and jQuery `.html()`-style content operations can inject executable markup. - Operations like `invokeObjectMethod` on `$globaldata` or controller objects already grant broad capability. - No untrusted party supplies the configuration in the normal deployment model, so this adds little to what a configuration author can already do.  It does contradict the CLAUDE.md rule "Guard against prototype pollution when resolving property chains", so it is worth fixing as hardening.

**Repro test.** `given a $operationdata chain of constructor.constructor, when getPropertyChainValue resolves it against a plain object, then it throws instead of returning the global Function constructor`

### 55. [low] Eventbus.once removes itself after the call: re-entrant re-fire, leaks on throw

[eventbus.ts:92](src/eventbus/eventbus.ts#L92) · area: eventbus-locale-util · reported severity: high · verifier: sonnet

**Summary.** The once decorator calls the handler first and runs off() afterwards. If the handler broadcasts the same event, synchronously or through another handler, the once handler runs again, and can recurse without bound. If the handler throws, off() never runs and the 'once' handler fires on every later broadcast. Reproduced: a once handler that rebroadcasts its own event ran 5 times, stopped only by the probe's counter.

**Failure scenario.** eventbus.once('x', () => eventbus.broadcast('x', [])) causes infinite recursion and a stack overflow. eventbus.once('timeline-play', () => { throw new Error() }) throws on every later timeline-play broadcast instead of only once.

**Evidence.**

```ts
const eventHandlerDecorator = (...args: any[]) => {
      eventHandler(...args);
      this.off(eventName, eventHandlerDecorator, eventTopic);
    };
```

**Fix.** In once(), remove the decorator before invoking the handler: `const d = (...args) => { this.off(eventName, d, eventTopic); eventHandler(...args); };`. Also make _callHandlers iterate over a copy (`[...handlers].forEach(...)`) so that removing a handler mid-dispatch does not skip the next one. Add specs for re-entrant rebroadcast, a throwing once handler (it must not fire again), and a once handler followed by another handler in the same array.

Original suggestion: Call this.off(...) before eventHandler(...args), the way TypedEventEmitter.once does. Add specs for re-entrancy and for a throwing once handler.

**Verifier.** The code at src/eventbus/eventbus.ts:91-94 calls eventHandler(...args) and only then this.off(...). I found no guard against this. _callHandlers (lines 195-222) iterates the live handlers array with forEach and has no re-entrancy or once-tracking. So the failure scenario holds when traced through the real code. If the once handler synchronously rebroadcasts its own event, the decorator is still registered and runs again, so it recurses. If the handler throws, off() is skipped and the decorator stays registered, so it fires on every later broadcast. The existing specs (eventbus.spec.ts lines 30-60) only cover plain call-once and remover-before-broadcast, so neither case is tested. A related defect: because off() splices the array while forEach is iterating it, the next handler in the same array is skipped. That is an additional symptom, not part of the original claim.  The severity is overstated. The only internal caller is src/eligius-engine.ts:285, which registers once('timeline-firstframe', async () => ...). That handler is async, so a throw becomes a rejected promise and not a synchronous throw. Its synchronous prefix broadcasts only 'timeline-duration' and never 'timeline-firstframe', so there is no re-entrancy from it. No operation or controller in src calls eventbus.once. Eventbus.once is public API, so third-party code can hit the bug. A valid configuration cannot trigger it through current internal code. I rate it low, or at most medium because of the public surface.

### 56. [low] LottieController.attach creates the lottie animation twice

[lottie-controller.ts:117](src/controllers/lottie-controller.ts#L117) · area: controllers · reported severity: medium · verifier: opus

**Summary.** attach() calls _createAnimation() twice in a row. Every attach therefore runs loadAnimation twice, destroys the first instance and rebuilds the SVG/canvas DOM, and calls playSegments for the freeze segment twice.

**Failure scenario.** addControllerToElement with LottieController -> lottie.loadAnimation runs twice and the first AnimationItem is destroyed immediately. Parse and render cost doubles, and with autoplay the animation briefly restarts.

**Evidence.**

```ts
this._createAnimation();
    this._createAnimation();
  }
```

**Fix.** Delete the duplicate this._createAnimation() call at lottie-controller.ts:118. Add a spec that asserts lottie.loadAnimation is called once per attach() and that the AnimationItem's destroy is not called during attach.

Original suggestion: Remove the duplicate call. Add a test asserting loadAnimation is called once per attach.

**Verifier.** F:\projects\eligius\eligius\src\controllers\lottie-controller.ts lines 117-118 call this._createAnimation() twice in a row inside attach(). Nothing guards against the second call. init() always sets serializedData (JSON.stringify of json/animationData), so with a valid operationData both calls get past the early return at the top of _createAnimation(). The second call runs this.animationItem?.destroy() on the first AnimationItem, then lottie.loadAnimation() again, and runs playSegments([0, freeze]) again when a freeze position is set. git log -L shows the duplicate line was added by accident in commit 9f9e9f2a ("Stricter eventbus typing (#71)"). Before that there was one call, so this is not intended behaviour. src\test\unit\controllers\LottieController.spec.ts mocks loadAnimation but never asserts how many times it is called, so no test covers or contradicts this. It is not a duplicate: the two confirmed Lottie bugs (detach/endPosition, and label localisation) are different defects. On the second call endPosition is not recomputed, because it is already >= 0 after the first call. So the final state matches a single call, and the cost is a wasted parse, DOM build and destroy, plus a possible brief restart with autoplay. Nothing user-visible breaks, so I lowered the severity to low.

**Repro test.** `given an initialised LottieController with animationData, when attach is called, then lottie.loadAnimation is called exactly once and the created animation item is not destroyed`

### 57. [low] Subtitle setTitle leaves stale text for a language with no subtitle

[subtitles-controller.ts:80](src/controllers/subtitles-controller.ts#L80) · area: controllers · reported severity: medium · verifier: opus

**Summary.** If titleLanguageLookup has no entry for currentLanguage, container.html(undefined) is called. jQuery's .html(undefined) is the getter overload, so nothing is written and the previous language's subtitle stays on screen. language-change is broadcast both as a command and as a notification (LocaleEventbusAdapter), and the controller takes any code, including one the adapter rejects as unavailable.

**Failure scenario.** Subtitle shown in en-US, then broadcast('language-change', ['de-DE']) where the subtitleData has no de-DE collection -> languageChangeHandler calls lastFunc -> html(undefined) is a no-op and the English text remains while the UI claims German.

**Evidence.**

```ts
setTitle(container: JQuery, titleLanguageLookup: Record<string, string>) {
    if (this.currentLanguage) {
      container.html(titleLanguageLookup[this.currentLanguage]);
    }
  }
```

**Fix.** In setTitle, use `container.html(titleLanguageLookup[this.currentLanguage] ?? '')`. Better: fall back to the init language's text when the current language has no entry, so the viewer still gets a subtitle rather than a blank.

Original suggestion: Use `container.html(titleLanguageLookup[this.currentLanguage] ?? '')`, or fall back to the init language, and consider ignoring language codes with no subtitle collection.

**Verifier.** I traced this through the code and it holds. In src/controllers/subtitles-controller.ts:42-46, languageChangeHandler accepts any language code without checking it, then re-runs lastFunc. setTitle (line 80) calls container.html(titleLanguageLookup[this.currentLanguage]). createActionLookup (lines 92-98) only adds keys for languageCodes that appear in subtitleData, so a language with no subtitle collection gives undefined.  jQuery 4.0.0 is installed (node_modules/jquery/dist/jquery.js). Its html(value) at line 5677 calls access(this, fn, null, value, arguments.length). In access(), at lines 841-880, the setter branch only runs when `value !== undefined` (line 854). With value undefined, chainable is 1 (truthy), so access returns the elements and writes nothing. The old language's subtitle stays on screen.  The scenario is reachable today with a valid configuration. In src/adapters/locale-eventbus-adapter.ts:83-90, the adapter warns and returns early for a locale that is not available, but that does not stop other listeners: the SubtitlesController's own 'language-change' listener has already set currentLanguage. For a locale that is available but has no subtitle collection (for example locales en-US and de-DE with subtitles only in en-US), the same no-op happens. The confirmed LocaleEventbusAdapter recursion bug currently also hits that path, but it is a separate root cause.  The existing tests in src/test/unit/controllers/SubtitlesController.spec.ts (lines 199-260) only switch between en-US and nl-NL, which both have subtitle data, so this case is not tested. This is a different defect from the confirmed 'Subtitles never show during video playback because positions are fractional' (that one is about matching positions to keys), so it is not a duplicate.  I lowered the severity to low. It only shows up when a configuration has subtitles for fewer languages than it lets the user switch to, and the result is stale text, not a crash.

**Repro test.** `given subtitle shown in en-US and subtitleData without de-DE, when language-change broadcast with de-DE, then container html is no longer the English text`

### 58. [low] NavigationController.detach clears window.onpopstate set by RoutingController

[navigation-controller.ts:111](src/controllers/navigation-controller.ts#L111) · area: controllers · reported severity: medium · verifier: opus

**Summary.** NavigationController never assigns window.onpopstate but nulls it in detach. That removes the handler RoutingController installed (routing-controller.ts:38). Both use the property-assignment form, so any other popstate handler on the page is clobbered as well.

**Failure scenario.** RoutingController and NavigationController are both attached, then the navigation menu is removed (removeControllerFromElement NavigationController). After that, browser Back/Forward no longer triggers RoutingController._handlePopstate and history navigation silently stops working.

**Evidence.**

```ts
this.container = null;
    window.onpopstate = null;
  }
```

**Fix.** Delete `window.onpopstate = null;` from NavigationController.detach (navigation-controller.ts:111), since this controller never owns that handler. In RoutingController, replace the property assignment with window.addEventListener('popstate', this._boundPopstate) in attach and window.removeEventListener('popstate', this._boundPopstate) in detach. That way neither controller clobbers handlers it did not install, including the host page's own.

Original suggestion: Remove the line from NavigationController. In RoutingController use window.addEventListener('popstate', handler) and remove it in detach, tracked through eventListeners.

**Verifier.** The code does what the report says. src/controllers/navigation-controller.ts:111 sets `window.onpopstate = null` in detach(), but NavigationController never assigns onpopstate anywhere. attach() (lines 35-57) only adds eventbus listeners, and `_initHistory.bind(this)` at line 56 is never invoked, which is a separate dead-code defect. RoutingController installs its handler with property assignment at src/controllers/routing-controller.ts:38. The two controllers are clearly meant to work as a pair: RoutingController broadcasts 'highlight-navigation' and 'request-current-navigation', and NavigationController handles both. So when NavigationController is detached while RoutingController is still attached, RoutingController's _handlePopstate is silently removed. A removeControllerFromElement on the menu does this, and so does a teardown order that detaches the navigation menu first. Even without RoutingController, detaching NavigationController wipes any `window.onpopstate` the host page set itself. No guard exists anywhere: grep finds only these three onpopstate writes. No test covers NavigationController.detach and onpopstate. The tests only check that RoutingController clears its own handler (memory-leak-detection.spec.ts:344). It is not a duplicate: no confirmed entry concerns popstate or navigation/routing controllers. Severity is downgraded to low. RoutingController carries the doc comment "This is a work in progress, do not use this yet please" (routing-controller.ts:12-14), so the main failure scenario needs a controller the project explicitly discourages. The remaining impact, clobbering a host page's own window.onpopstate on detach, is a real but narrow side effect. It only matters when a NavigationController is removed mid-session or on engine destroy, while the host relies on property-style popstate handling.

**Repro test.** `given RoutingController and NavigationController attached to the same eventbus, when NavigationController.detach is called, then window.onpopstate still invokes RoutingController's popstate handler`

### 59. [low] Navigation menu click broadcasts request-video-url twice

[navigation-controller.ts:167](src/controllers/navigation-controller.ts#L167) · area: controllers · reported severity: medium · verifier: opus

**Summary.** _menuMouseupHandler broadcasts request-video-url itself and then calls _handleNavigateVideoUrl, which broadcasts request-video-url again (with position 0) and pushes the history state.

**Failure scenario.** User clicks a menu item -> two request-video-url events per click -> the RequestVideoUriInterceptor and before-request-video-url listeners run twice. RoutingController pushes or replaces history twice, and the video source may be loaded twice.

**Evidence.**

```ts
if (navdata) {
      this.eventbus?.broadcast('request-video-url', [navdata.videoUrlIndex]);
      this._handleNavigateVideoUrl(navdata.videoUrlIndex);
    }
```

**Fix.** Remove the broadcast at navigation-controller.ts:167 and keep only the call to `this._handleNavigateVideoUrl(navdata.videoUrlIndex)`. That call already broadcasts `request-video-url` with `[index, 0]`, highlights the menu and pushes history state.

Original suggestion: Drop the first broadcast and let _handleNavigateVideoUrl do it.

**Verifier.** The double broadcast is real, but the consequences the report claims are wrong, so the severity is lower than reported.  In F:\projects\eligius\eligius\src\controllers\navigation-controller.ts, `_menuMouseupHandler` (lines 164-170) broadcasts `'request-video-url', [videoUrlIndex]`. It then calls `_handleNavigateVideoUrl` (lines 172-182), which broadcasts `'request-video-url', [index, 0]` again. No guard sits between the two calls. A mouseup on any nav anchor wired by `_addClickHandler` (line 161) therefore emits the event twice. This is reachable from a valid configuration: an `addControllerToElement` operation for NavigationController, then a user click.  What the report gets wrong: 1. `RequestVideoUriInterceptor` is registered for `'request-timeline-uri'`, not `'request-video-url'` (src\engine-factory.ts:161-166). It does not run twice. 2. Nothing in src emits `'before-request-video-url'`. RoutingController's listener for it (routing-controller.ts:27-31) never fires from this path. 3. History is pushed once. `_pushCurrentState` runs once, from `_handleNavigateVideoUrl`, and broadcasts `push-history-state` once. 4. No engine code subscribes to `'request-video-url'`, so nothing gets loaded twice internally.  The only visible effect is on user-configured event actions or external listeners for `request-video-url`. They run twice per click, and the first call has no position argument. The tests in src\test\unit\controllers\NavigationController.spec.ts never simulate a menu mouseup and do not count calls, so no test covers this.  This is not a duplicate of any confirmed bug, which are all different defects. Severity is low: a redundant event in a controller with no internal consumer of that event.

**Repro test.** `given an attached NavigationController with navigation data, when a menu anchor receives mouseup, then request-video-url is broadcast exactly once with [videoUrlIndex, 0]`

### 60. [low] RoutingController.attach crashes on an unknown hash and requests NaN position

[routing-controller.ts:42](src/controllers/routing-controller.ts#L42) · area: controllers · reported severity: medium · verifier: opus

**Summary.** The hash segment is used directly as a navLookup key without checking that it exists. When the position segment is missing, +undefined yields NaN, which is broadcast as the video position. request-current-video-position has no handler anywhere in src, so _pushState always writes position -1 into the URL.

**Failure scenario.** The user opens '#/old-chapter' (renamed id) -> TypeError reading 'videoUrlIndex' of undefined thrown from attach, inside the addControllerToElement operation. Opening '#/intro' -> request-video-url with position NaN.

**Evidence.**

```ts
const nav = this.navLookup[navId];
      const pos = +this._getQueryVariable(1);
      this.eventbus.broadcast('request-video-url', [
        nav.videoUrlIndex,
```

**Fix.** In attach() and _handlePopstate, look up nav with this.navLookup[navId] ?? this.navigation[0] (and return early if navigation is empty). Parse pos with Number.parseFloat and fall back to 0 when the result is not finite. Use the same fallback for event.state.navigationId in _handlePopstate.

Original suggestion: Validate nav and fall back to navigation[0]. Parse the position with Number.parseFloat and default to 0 when it is not finite.

**Verifier.** Traced in F:\projects\eligius\eligius\src\controllers\routing-controller.ts. attach() (lines 40-48) reads navId from the URL hash and indexes this.navLookup[navId] without checking that the entry exists. With '#/unknown', nav is undefined and nav.videoUrlIndex throws a TypeError inside attach. With '#/nav1' (no position segment), _getQueryVariable(1) returns undefined, +undefined is NaN, and NaN is broadcast as the position. _handlePopstate (line 63) has the same unguarded lookup. No other code validates the hash first. The hash comes from the page URL, not the configuration, so a valid config plus an old bookmark or a renamed nav id is enough to trigger it. The existing spec (src\test\unit\controllers\RoutingController.spec.ts:126) only covers the happy path '#/nav2/10'. The claim that 'request-current-video-position has no handler' is also right: nothing in src handles it, so _pushState writes -1. Mitigating factors, which is why severity drops to low: the class JSDoc (line 13) says 'This is a work in progress, do not use this yet please', and nothing in src handles 'request-video-url' either, so the feature does not work end to end anyway. It is still exported from src/controllers/index.ts:17, so it is reachable through the public API. This is not a duplicate: none of the confirmed bugs concern RoutingController.

**Repro test.** `given URL hash '#/unknown-id' and valid navigation data, when RoutingController.attach is called, then it does not throw and broadcasts request-video-url for the first navigation entry with position 0`

### 61. [low] DOMEventListenerController.detach removes every handler for the event

[dom-event-listener-controller.ts:125](src/controllers/dom-event-listener-controller.ts#L125) · area: controllers · reported severity: medium · verifier: opus

**Summary.** detach calls .off(eventName) without the handler reference, which removes every jQuery handler for that event on the element, including other controllers' and user code's. The bound handler is not stored. actionInstanceInfos is not reset either, so a later attach skips `selectedElement.on(...)` and the listener is never re-registered.

**Failure scenario.** Two DOMEventListenerControllers are on the same button with eventName 'click' (different actions). Removing one -> the other's click handler is gone too and its actions stop firing.

**Evidence.**

```ts
detach(_eventbus: IEventbus) {
    this.operationData?.selectedElement.off(this.operationData.eventName);
  }
```

**Fix.** In attach, store the bound handler (`this._handler = this._eventHandler.bind(this)`) and register it under a unique jQuery namespace (e.g. `${eventName}.${uuid}`) or pass the handler reference. In detach, call `selectedElement.off(eventName, this._handler)` (or off on the namespaced event), then clear `_handler` and `actionInstanceInfos` so a later re-attach registers again.

Original suggestion: Store `this._handler = this._eventHandler.bind(this)`, call `.off(eventName, this._handler)` in detach and reset actionInstanceInfos. Consider extending BaseController for consistency.

**Verifier.** Traced in F:\projects\eligius\eligius\src\controllers\dom-event-listener-controller.ts. attach() (line 75) registers `selectedElement.on(eventName, this._eventHandler.bind(this))` without storing the bound function or using a namespace. detach() (line 125) calls `selectedElement.off(eventName)` with no handler, and jQuery's off(type) removes every handler of that type on the element. The trigger is a valid config: two addControllerToElement calls with DOMEventListenerController on the same element and eventName 'click' but different actions, followed by removeControllerFromElement with controllerName 'DOMEventListenerController' (src/operation/remove-controller-from-element.ts lines 35-43). That splices one controller and calls its detach, which also strips the click handler of the remaining controller and any user jQuery click handlers. The remaining controller is still listed in the element's controller data but no longer fires. The existing test (src/test/unit/controllers/DOMEventListenerController.spec.ts:104) mocks `off` and only checks that it was called with the event name, so it does not prove otherwise. The second claim does not hold in practice: actionInstanceInfos is never reset, so re-attaching the same instance would skip `.on`, but removeControllerFromElement throws the instance away and addControllerToElement takes a fresh controllerInstance, so the stale-guard path cannot be reached through the operations. Severity lowered to low because it needs two same-event listeners on one element plus an explicit removal.

**Repro test.** `given two DOMEventListenerControllers attached to the same element for 'click', when the first controller is detached and the element is clicked, then the second controller's action start is still called`

### 62. [low] ProgressbarController keeps stale duration and computes Infinity/NaN width

[progressbar-controller.ts:35](src/controllers/progressbar-controller.ts#L35) · area: controllers · reported severity: medium · verifier: opus

**Summary.** The duration is read once at attach and never refreshed, even though the engine broadcasts 'timeline-duration' on timeline change. With duration 0 (no timeline yet, or a request that returns undefined) percentage = (100/0)*position gives Infinity, or NaN at position 0, which is written to CSS and text.

**Failure scenario.** switchTimeline from a 60s to a 120s timeline -> the bar reaches 100% at 60s and then grows to 200%, and click-to-seek maps into the wrong range. If attached while duration is 0, the text shows 'NaN%' or 'Infinity%'.

**Evidence.**

```ts
this.duration = eventbus.request<number>('timeline-duration-request') ?? 0;
...
    const percentage = (100 / this.duration) * position;
    this.selectedElement?.css('width', `${percentage}%`);
    this.textElement?.text(`${Math.floor(percentage)}%`);
```

**Fix.** In attach(), subscribe via this.addListener(eventbus, 'timeline-duration', getDuration => { this.duration = getDuration() ?? 0; }), so the remover is cleaned up in detach. In _positionUpdateHandler, return early when !(this.duration > 0), and clamp the percentage to [0, 100]. In _clickHandler, skip the seek when duration <= 0. The 'timeline-duration' argument is a function, the source's getDuration method passed unbound. Unbound, it will fail on BasePositionSource (this._duration). Either bind it in the engine broadcast or re-request 'timeline-duration-request' inside the listener.

Original suggestion: Listen to 'timeline-duration' (its arg is a getter function) and update this.duration. Guard duration <= 0 and clamp the percentage to [0,100].

**Verifier.** The code defect is real, but on today's code it is hard to reach.  The defect: src/controllers/progressbar-controller.ts:35 reads the duration once, in attach(), via eventbus.request('timeline-duration-request') ?? 0. The controller never subscribes to 'timeline-duration'. The engine broadcasts that event in two places: on the first frame (src/eligius-engine.ts:421) and on a delayed switchTimeline (src/eligius-engine.ts:291). Line 53 divides by this.duration with no guard, so a duration of 0 gives Infinity, or NaN at position 0. The request is answered by EngineEventbusAdapter._registerRequest (engine-eventbus-adapter.ts:148), which returns engine.duration. ProgressbarController.spec.ts only tests a duration mocked at 100 and never tests a duration change or 0.  Why it is hard to reach: 1. The zero-duration case is mostly out of reach in the normal flow. Engine.init runs initActions only after `await positionSource.init()` (eligius-engine.ts, init path). RafPositionSource gets its duration from config at construction. VideoPositionSource.doInit resolves after the player is ready or canplay, so the controller usually sees a real duration. 2. The stale-duration case needs the active duration to change. Same-type timelines share one position source, so the engine itself never reports a new duration (already-confirmed bug "Same-type timelines share one position source sized to the first one's duration"). A cross-type switchTimeline (animation to mediaplayer) does swap _activePositionSource to a source with a different getDuration(), and that is reachable through the documented switchTimeline API. In that case a progressbar attached in initActions keeps the old duration, or 0 if the new video source is uninitialised (related confirmed bug "switchTimeline to another type activates an uninitialised, unwired source").  Not a duplicate: the root cause, a controller that never listens to 'timeline-duration' and has no zero guard, is separate from those engine bugs. Fixing the engine bugs would expose this one fully.  Severity is low today. Once the switch bugs are fixed, any multi-timeline config with a progressbar will be wrong after a switch.

**Repro test.** `given ProgressbarController attached with duration 60, when 'timeline-duration' is broadcast with a getter returning 120 and then 'timeline-time' 90 is broadcast, then the selected element width is 75% (not 150%)`

### 63. [low] animateWithClass leaks `removeClass` into later operations and can hang forever

[animate-with-class.ts:14](src/operation/animate-with-class.ts#L14) · area: operations-a · reported severity: medium · verifier: opus

**Summary.** Neither `removeClass` nor `className` is erased, so a later animateWithClass that does not set removeClass inherits the earlier value. The promise also only settles on an animation-end event. That event never fires if the class defines no animation, the element is display:none, the jQuery set is empty, or reduced-motion styles disable the animation, so the action stalls for good. Separately, an animationend that bubbles up from a child element resolves the promise early. The listed name `animationEnd` is never dispatched, because the real event is lowercase `animationend`.

**Failure scenario.** op1 animateWithClass {className:'fade', removeClass:false}, then op2 animateWithClass {className:'pulse'}. op2 receives removeClass=false and leaves 'pulse' on the element, against the documented default of true. Separately, animateWithClass {className:'no-anim'} never resolves, so the remaining operations in the action never run.

**Evidence.**

```ts
removeClass?: boolean;  (no @erased)
...
selectedElement.one(
          'webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd',
          () => {
```

**Fix.** In the animateWithClass resolve callback, delete `removeClass` (and `className`, to match addClass) from operationData before calling internalResolve, tag both properties @erased, and rerun `npm run metadata` and `npm run generate-schema`. Optionally add plain 'animationend' to the event list. Treat the hang when no animation exists as a separate design improvement (timeout, or a check for animation-name 'none'), not as this bug.

Original suggestion: Erase removeClass (and className, to match addClass) and tag both @erased. Listen for 'animationend webkitAnimationEnd' and ignore events where e.target !== e.currentTarget. Resolve immediately when getComputedStyle reports animation-name 'none' or the set is empty, or add a timeout fallback.

**Verifier.** Only one of the report's claims holds up. Each operation's configured data is copied and merged onto the data flowing from the previous operation (src/action/action.ts:90-92, `Object.assign(previousOperationData, copy)`). animateWithClass (src/operation/animate-with-class.ts:14, 28-29) never erases `removeClass`, and the property has no @erased tag. So a later animateWithClass that leaves out `removeClass` picks up an earlier `false` and keeps its class on the element, even though the default is true. The input is a valid configuration with two animateWithClass calls in one action. Not a duplicate: no confirmed entry covers animateWithClass or leaked data.  Claims refuted or downgraded: (1) The 'animationEnd' casing claim is harmless. Under the DOM spec's legacy event-type fallback, an element with no `animationend` listener but a `webkitAnimationEnd` listener gets the event dispatched as `webkitAnimationEnd`. Chrome, Firefox and Safari all do this, so the jQuery `.one('webkitAnimationEnd ...')` handler does fire. (2) "Hangs if the class defines no animation" is how the operation is designed. Its TypeDoc says it "assumes that this class triggers an animation" and waits for it to finish. (3) A bubbling animationend from a child element, or an empty or display:none set, are edge cases that depend on runtime CSS and DOM state. I am not counting them as confirmed. `className` also leaks, but it is @required, so every call overrides it.  Severity is low. Triggering it needs an earlier `removeClass:false` in the same action, and the result is a class left on the element, not a crash.

**Repro test.** `given an action with animateWithClass {className:'fade', removeClass:false} followed by animateWithClass {className:'pulse'} with no removeClass, when the second animation ends, then 'pulse' is removed from the element`

### 64. [low] clearStorage wipes all storage when key is empty or whitespace

[clear-storage.ts:53](src/operation/clear-storage.ts#L53) · area: operations-a · reported severity: medium · verifier: opus

**Summary.** An empty or whitespace key, for example one resolved from an unset variable or blank form field, falls through to `storage.clear()`. The operation then deletes every key on the origin instead of failing or doing nothing. This is destructive and silent.

**Failure scenario.** clearStorage {key:'', storageType:'local'} (or a key resolved to '  '). All localStorage entries, including unrelated app state, are removed.

**Evidence.**

```ts
if (key && key.trim() !== '') {
    storage.removeItem(key);
  } else {
    storage.clear();
  }
```

**Fix.** Clear all storage only when `key === undefined`. When key is present but blank after trim, throw `new Error('clearStorage: key must be a non-empty string')`, as saveToStorage does. Update the TypeDoc to state this and add a spec case.

Original suggestion: Only clear everything when `key === undefined` (property absent). Throw 'clearStorage: key must be a non-empty string' when key is present but blank. Also validate storageType instead of defaulting to localStorage.

**Verifier.** The report describes the code correctly. In F:\projects\eligius\eligius\src\operation\clear-storage.ts lines 53-57, `if (key && key.trim() !== '') removeItem(key) else storage.clear()` sends key '' or '   ' to the clear-everything branch. I found no guard that stops this. The schema type is `key?: string`, so `{key: '', storageType: 'local'}` is a valid configuration, and a key resolved from operation data (for example an empty form value) arrives as ''. The TypeDoc says "If `key` is provided, removes only that key. If `key` is omitted, clears all storage." A blank key is provided, not omitted, so the behaviour breaks the documented contract. It also disagrees with the sibling operation: F:\projects\eligius\eligius\src\operation\save-to-storage.ts line 59 throws 'saveToStorage: key is required' for the same blank or whitespace key. F:\projects\eligius\eligius\src\test\unit\operation\clear-storage.spec.ts only covers a real key, an omitted key, a nonexistent key and property erasure. No test covers a blank key, either to prove or to forbid the behaviour. The explicit trim check suggests the author chose to treat blank as omitted on purpose, but that choice is undocumented and destructive. I lowered the severity because it needs a blank key, either written into the configuration or resolved from data. A normal configuration does not trigger it. It is also not a duplicate of any confirmed bug.

**Repro test.** `given localStorage holds 'a' and 'b', when clearStorage is called with key '' and storageType 'local', then it throws and both keys remain`

### 65. [low] RoutingController.attach crashes on unknown or crafted URL hash

[routing-controller.ts:257](src/controllers/routing-controller.ts#L257) · area: lens-security-robustness · reported severity: medium · verifier: opus

**Summary.** The navigation id comes straight from location.hash and is looked up in a plain object without an existence check. An unknown id throws a TypeError inside attach. An id such as '__proto__' or 'constructor' resolves to Object.prototype or a function and broadcasts request-video-url with undefined. _handlePopstate does the same with history state.

**Failure scenario.** User opens page.html#/doesnotexist/5 -> attach throws 'Cannot read properties of undefined (reading videoUrlIndex)', the addControllerToElement operation fails and the rest of the action chain does not run. NavigationController._initHistory has the same pattern.

**Evidence.**

```ts
const navId = this._getQueryVariable(0);
    if (navId) {
      const nav = this.navLookup[navId];
      const pos = +this._getQueryVariable(1);
      this.eventbus.broadcast('request-video-url', [
        nav.videoUrlIndex,
```

**Fix.** In attach() and _handlePopstate, look up the navigation entry with an own-property check, using `Object.hasOwn(this.navLookup, navId)` or `navLookup = Object.create(null)` or a Map. If the id is unknown, fall back to `this.navigation[0]`, the same entry the no-hash branch uses. Parse the position with Number and default it to 0 when `!Number.isFinite(pos)`. NavigationController needs no change because _initHistory is never invoked; separately, decide whether the dead `this._initHistory.bind(this)` should be a call or should be removed.

Original suggestion: Store navLookup in a Map (or Object.create(null)), check Object.hasOwn, and fall back to navigation[0] for unknown ids. Validate pos with Number.isFinite.

**Verifier.** The core trace holds, but parts of the report are wrong. Line 257 does not exist: F:\projects\eligius\eligius\src\controllers\routing-controller.ts has only 183 lines, and the defect is at lines 40-45. In attach(), `navId = this._getQueryVariable(0)` comes from location.hash and is looked up with `this.navLookup[navId]`, a plain `{}` built in _buildNavigationData (lines 155-161). Nothing checks that the entry exists before `nav.videoUrlIndex` is read. Loading page.html#/doesnotexist/5 therefore throws a TypeError synchronously inside attach(). That call comes from add-controller-to-element.ts:39, so the operation chain is aborted. _handlePopstate (lines 63-64) has the same pattern, but it only fails when history.state holds an id that is not in the lookup, which is much harder to reach.  The '__proto__'/'constructor' case does not pollute anything. It only resolves to Object.prototype or Object, and request-video-url is then broadcast with an undefined index. That is a silent bad request, not a security issue.  The claim that NavigationController._initHistory has the same pattern is wrong in effect. navigation-controller.ts:56 only does `this._initHistory.bind(this);` and never calls the result, so _initHistory never runs.  The existing tests in src/test/unit/controllers/RoutingController.spec.ts cover only a known navId ('should handle URL with navigation ID'). No test covers an unknown one.  Severity is lowered to low. The class JSDoc (routing-controller.ts:12-14) says "This is a work in progress, do not use this yet please". The controller is still exported from src/controllers/index.ts and can be picked in configuration metadata, so a valid config plus a user-edited URL can trigger the crash. However, it affects only an explicitly unsupported controller, and only when someone edits the URL by hand.

**Repro test.** `given RoutingController initialised with navigation data and location hash '#/doesnotexist/5', when attach is called, then it does not throw and broadcasts request-video-url for the first navigation entry`

### 66. [low] DOMEventListenerController detach removes all handlers and blocks re-attach

[dom-event-listener-controller.ts:465](src/controllers/dom-event-listener-controller.ts#L465) · area: lens-security-robustness · reported severity: medium · verifier: opus

**Summary.** detach calls .off(eventName) without the bound handler or a namespace, so it removes every handler for that event on the element, including those of other controllers. actionInstanceInfos is never cleared, so a later attach() skips the `.on()` registration and the controller stays deaf.

**Failure scenario.** Two DOMEventListenerControllers listen for 'click' on the same button. removeControllerFromElement removes one, and the other's click actions stop firing as well. Calling detach() and then attach() on one controller leaves it with no listener.

**Evidence.**

```ts
if (!this.actionInstanceInfos) {
      this.actionInstanceInfos = [];
...
      selectedElement.on(eventName, this._eventHandler.bind(this));
    }
...
  detach(_eventbus: IEventbus) {
    this.operationData?.selectedElement.off(this.operationData.eventName);
  }
```

**Fix.** In attach, store the bound handler, e.g. `this._boundHandler = this._eventHandler.bind(this); selectedElement.on(eventName, this._boundHandler);`. In detach, call `selectedElement.off(eventName, this._boundHandler)`, then clear the stored handler and set `this.actionInstanceInfos = undefined`. The cleared state lets a later attach register the handler again and request the action instances fresh. A unique per-instance namespace ('click.eligius-<uuid>') works as well.

Original suggestion: Keep the bound handler, or use a unique namespace ('click.eligius-<uuid>'), and call off with it. Reset actionInstanceInfos in detach.

**Verifier.** The report's line 465 is wrong. The file is about 127 lines long, and detach is at src/controllers/dom-event-listener-controller.ts:124-126. The code matches the evidence quoted in the report.  Half 1 holds. attach (line 75) registers `selectedElement.on(eventName, this._eventHandler.bind(this))` and keeps no reference to the bound handler. It also uses no namespace. detach (line 125) calls `selectedElement.off(eventName)` with no handler argument, and jQuery's off(type) then removes every handler for that event type on the element. Here is the path from a valid config. Run addControllerToElement twice on the same button, each time with a DOMEventListenerController for eventName 'click' and different actions. Later run removeControllerFromElement with controllerName 'DOMEventListenerController' (src/operation/remove-controller-from-element.ts:34-42). It finds the first controller by name, splices it out and calls detach. That detach strips the second controller's click handler as well. The second controller is still in the element's controller list but never fires again. The same call also removes any jQuery click handlers that the host page attached to that element. No guard exists for this. The unit test (src/test/unit/controllers/DOMEventListenerController.spec.ts:104) only asserts that off was called with the event name, so it does not prove the opposite.  Half 2, "detach then attach leaves it deaf", is true in the code because actionInstanceInfos is never reset. It cannot be reached from configuration, though. removeControllerFromElement takes the controller off the element after detaching it. getControllerInstance makes a new instance through 'request-instance' every time. Nothing in the engine attaches a detached instance again. So only the shared-handler half counts.  It is not a duplicate. None of the confirmed bugs concern DOMEventListenerController or jQuery off without a handler. The only confirmed controller bugs are the Lottie and Subtitles ones.  Severity: low. The trigger is uncommon: two listener controllers for the same event on the same element with one removed, or host-page jQuery handlers on an element whose controller gets removed. When it does happen, other handlers fail silently.

**Repro test.** `given two DOMEventListenerControllers listening for click on the same element, when one is detached, then a click still executes the other controller's actions`

### 67. [low] loadJson ignores HTTP status, errors lack op name, cache shares mutable object

[load-json.ts:29](src/operation/load-json.ts#L29) · area: lens-security-robustness · reported severity: medium · verifier: opus

**Summary.** Unlike http-* operations, loadJson does not check response.ok, so a 404 HTML page surfaces as a bare SyntaxError from response.json(). The cached object is handed out by reference, so later operations that mutate operationData.json corrupt the cache for later actions.

**Failure scenario.** loadJson {url:'/missing.json'} on a server returning a 404 HTML page -> 'Unexpected token < in JSON' with no mention of loadJson or the URL. With cache:true, setData {'$operationdata.json.title':'x'} changes the cached object, and every later loadJson for that URL sees 'x'.

**Evidence.**

```ts
const response = await fetch(url);
  const json = await response.json();
  const cacheValue = (operationData.json = json);
```

**Fix.** If `!response.ok`, throw `new Error(\`loadJson: ${url} responded ${response.status} ${response.statusText}\`)`. Wrap the `response.json()` parse error the same way so it names loadJson and the URL. Use a `Map<string, unknown>` for the cache, check hits with `jsonCache.has(url)`, and return `deepCopy(jsonCache.get(url))` (the existing helper in `@operation/helper/deep-copy.ts`) on a hit. Store a deep copy on a miss as well, so the caller's object is never the cached one.

Original suggestion: Check response.ok and wrap errors as `loadJson: <url>: <message>`. Return deepCopy(jsonCache[url]) on cache hits, and use a Map for the cache.

**Verifier.** I traced both claims in F:\projects\eligius\eligius\src\operation\load-json.ts and both hold.  1. HTTP status is ignored. Lines 52-53 call `await fetch(url)` and then `await response.json()` without checking `response.ok`. The http-delete, http-post and http-put operations do check it (http-delete.ts:60, http-post.ts:70, http-put.ts:70). Nothing else catches the error. A 404 that returns an HTML page throws a bare SyntaxError that names neither loadJson nor the URL. If the server returns a JSON error body, loadJson resolves and quietly puts that error payload into `json`. The spec src\test\unit\operation\load-json.spec.ts never tests status or ok.  2. The cache shares one mutable object. A cache hit (line 47) does `operationData.json = jsonCache[url]` and a miss stores that same `json` reference (lines 54-57). There is no deepCopy at either point. setData (src\operation\set-data.ts, resolveTargets) walks the `$operationdata.json` chain with getPropertyChainValue and assigns `propertyTarget[property] = value` straight onto the cached object. Every later `loadJson {cache:true}` for that URL then gets the mutated data.  A minor extra: the truthiness check `cache && jsonCache[url]` means cached falsy JSON values such as 0, false, null or "" are fetched again every time.  This is not a duplicate. No confirmed bug covers loadJson. It is a separate defect, not the setData prototype-pollution or resolvePropertyValues bugs.  Severity: low. Only a misconfigured URL or server error triggers the first part, and its effect is a poor error message, not engine corruption. The cache aliasing needs both `cache:true` and a later mutation of `json`. That is reachable from a valid configuration but uncommon.

**Repro test.** `given loadJson with cache true and a mutated json result, when loadJson is called again for the same url, then the second result is not affected by the mutation; and given fetch returns a 404 response with an HTML body, when loadJson runs, then it rejects with an error naming loadJson and the url`

### 68. [low] Global data store and loadJson cache are module singletons never cleared on destroy

[globals.ts:3](src/operation/helper/globals.ts#L3) · area: operations-b · reported severity: medium · verifier: opus

**Summary.** `cache` in globals.ts and `jsonCache` in load-json.ts are module-level. clearGlobals and clearCache are never called outside tests; neither EngineFactory's destroy() nor engine destroy calls them. Globals from one engine therefore leak into the next engine created in the same page, along with any DOM or jQuery references stored in them.

**Failure scenario.** Engine A runs setGlobalData {propertyNames:['user']} -> await destroy() -> createEngine(configB): a `when` on '$globaldata.user' in engine B still sees A's value, and A's stored references are never garbage collected.

**Evidence.**

```ts
const cache: TGlobalCache = {};  // globals.ts:3
const jsonCache: Record<string, unknown> = {};  // load-json.ts:4
(grep: clearGlobals/clearCache have no callers in src/ outside test/)
```

**Fix.** Call clearGlobals() in the destroy() returned by EngineFactory.createEngine, after end operations have run. Export clearGlobals publicly so hosts that run several engines can reset the store. Leave the loadJson cache alone, or at most export clearCache. Longer term, scope global data per engine and pass it through IOperationScope.

Original suggestion: Call clearGlobals() and clearCache() from the destroy() returned by createEngine (or from EligiusEngine.destroy). Better long-term: scope the store per engine and pass it through IOperationScope.

**Verifier.** I traced this through the code and it holds, but the effect is small. src/operation/helper/globals.ts:3 holds `cache` at module level. `clearGlobals` (line 30) is only called from tests. EngineFactory's destroy() never calls it, and neither does the engine's destroy(). It is also not exported from src/index.ts or src/operation/index.ts, so a consumer has no public way to clear it either. Engine B therefore sees values that engine A wrote. setData targets `$globaldata.*`, and the `$globaldata` branch at resolve-external-property-chain.ts:35-36 reads them back for `when`. Stored jQuery or DOM references stay reachable after destroy(). That goes against the CLAUDE.md rule 'Remove listeners and DOM references on detach/destroy' and 'Avoid global state'.  The loadJson half is not a real defect. `jsonCache` is an opt-in, URL-keyed response cache (`cache: true`), and sharing fetched JSON across engines is reasonable cache behaviour. It holds plain JSON, not DOM references.  I lowered the severity to low. The bug needs several engines created one after another on the same page, plus a configuration that relies on a global being absent or holding large or DOM data. The store is also named and documented as "global data" (CHANGELOG 'Add setGlobalData'), so persistence across engines is partly by design. It is not a duplicate: none of the confirmed bugs cover the global data store.

**Repro test.** `given engine A stored a value under $globaldata.user via setData, when its factory destroy() resolves and a second engine is created, then getGlobals('user') is undefined`

### 69. [low] Function-valued operation data (mapArray/sortArray) crashes Action's structuredClone

[deep-copy.ts:5](src/operation/helper/deep-copy.ts#L5) · area: operations-b · reported severity: medium · verifier: opus

**Summary.** deepCopy uses structuredClone, which throws DataCloneError on functions. Action.executeOperation deep-copies each operation's operationData before every call. So mapArray.mapFunction and sortArray.sortComparator, both of which are typed and documented, cannot be supplied through an action, including from the fluent ConfigurationFactory. With the JSON fallback the functions would vanish silently instead.

**Failure scenario.** factory.createTimelineAction(...).addStartOperation('mapArray', {mapFunction: x => x * 2}) -> on execution structuredClone throws DataCloneError and the action rejects (setGlobal with a function threw DataCloneError in the probe).

**Evidence.**

```ts
const copyFunction =
  typeof structuredClone !== 'undefined'
    ? structuredClone
    : <T>(original: any) => JSON.parse(JSON.stringify(original)) as T;
// action.ts:90  const copy = deepCopy(operationInfo.operationData ?? {});
```

**Fix.** Do not try to clone functions through configuration. Either:  1. Remove the function-typed parameters from mapArray and sortArray. Replace them with declarative options (for example sortProperty/sortOrder, which already exist, and a property-chain map), or with a named-function registry resolved by ConfigurationResolver that fails fast on unknown names. 2. Or make deepCopy a custom recursive clone that keeps functions, jQuery objects and DOM nodes by reference. If you take this route, document that function-valued parameters only work with the TypeScript fluent API and never from JSON configuration.  Either way, add a configuration-level test, not just the existing direct-call unit tests.

Original suggestion: Make deepCopy preserve functions, jQuery objects and DOM nodes by reference (a custom recursive clone). Otherwise remove the function-typed parameters, or resolve them by name from a registry.

**Verifier.** The mechanism holds, but the crash happens earlier than the report says. deepCopy (src/operation/helper/deep-copy.ts:3-6) uses structuredClone, which throws DataCloneError on any function value. The JSON fallback would drop the function silently instead. Function-valued operationData cannot survive any of the paths that copy it:  - ConfigurationFactory.getConfiguration and the related config copies deep-copy the whole configuration (configuration-factory.ts:266/269). - The action editors copy too (action-editor.ts:53 and 460, action-creator-factory.ts:146). - ConfigurationResolver deep-copies each operation's operationData (configuration-resolver.ts:151). - Action.executeOperation copies it again (action.ts:90).  So `addStartOperation('mapArray', {mapFunction: x => x * 2})` built with the fluent API throws as soon as the configuration is copied or resolved, before any action runs. mapArray.mapFunction (map-array.ts:14, with @example usages) and sortArray.sortComparator (sort-array.ts:26) are typed and documented, but their only tests are unit specs that call the operation function directly (test/unit/operation/map-array.spec.ts, sort-array.spec.ts), so no test covers the configuration path.  Severity is lowered to low. The primary input is a JSON configuration validated against the JSON schema, and JSON cannot carry a function in the first place. So no schema-valid JSON config can trigger this. Only the TypeScript fluent API, or a hand-built IEngineConfiguration object, can supply a function. The effect is that a documented operation parameter cannot be used from any configuration, which is a design gap rather than a runtime regression on valid configs.  This is not a duplicate. No confirmed bug concerns deepCopy or structuredClone with function values. The confirmed bug "Action editors copy the action, so edits never reach the factory configuration" also involves copying, but its defect is that edits are lost, not this one.

**Repro test.** `given a ConfigurationFactory timeline action with a mapArray start operation whose mapFunction is a function, when getConfiguration is called and the configuration is resolved and the action started, then it does not throw DataCloneError and mappedArray contains the mapped values`

### 70. [low] onContainerReady never fires: video.js 8 player has no 'firstplay' event

[video-position-source.ts:322](src/timelineproviders/position-sources/video-position-source.ts#L322) · area: timeline-providers-adapters · reported severity: medium · verifier: opus

**Summary.** Container-ready callbacks are tied to `player.one('firstplay')`. video.js 8 (package.json pins 8.24.2) removed the player 'firstplay' event; the only remaining trigger is internal to VHS's playlist controller for live HLS. Callbacks registered through onContainerReady are therefore never called.

**Failure scenario.** A consumer uses VideoPositionSource as its IContainerProvider and calls onContainerReady(() => render()). render is never called, even after playback starts. The unit test passes only because the mock triggers 'firstplay' by hand.

**Evidence.**

```ts
`this._player.one('firstplay', () => { this._notifyContainerReady(); });`
node_modules/video.js/dist/video.es.js: the only `this.trigger('firstplay')` is inside the VHS playlist controller live-seek path (line 52908), listened to via `this.on(this.playlistController_, 'firstplay', ...)`.
```

**Fix.** Replace `this._player.one('firstplay', ...)` with `this._player.one('playing', ...)` (or 'loadeddata' if readiness should mean the first frame is available). Track a `_containerReady` flag. In onContainerReady, invoke the callback immediately if the flag is already set, as DomContainerProvider does. Update the spec mocks to trigger the real event name.

Original suggestion: Use the 'playing' event (first occurrence) or 'loadeddata' for container readiness. Also invoke late subscribers right away once the container is ready, as DomContainerProvider does.

**Verifier.** I traced the code and the report holds. In F:\projects\eligius\eligius\src\timelineproviders\position-sources\video-position-source.ts:136, doInit sets up the container-ready notification with `this._player.one('firstplay', ...)`. The installed video.js is 8.24.2 (node_modules/video.js/package.json). The player itself never triggers 'firstplay' in 8.x. The only `this.trigger('firstplay')` is at node_modules/video.js/dist/video.es.js:52908, which is inside the VHS PlaylistController's live-seek path. That event fires on the playlistController, not on the Player. It does not bubble to the player; VHS listens for it directly at line 55775. So `_notifyContainerReady` is never called and callbacks registered through `onContainerReady` never run. Late subscribers are not handled either. I found no guard or alternative trigger anywhere. The unit tests (src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts:229-230, 643-644, 663) fire 'firstplay' by hand on a mock, so they do not prove real-player behaviour. Severity: VideoPositionSource is publicly exported (src/timelineproviders/index.ts:34), and its class JSDoc example at line 65 documents `onContainerReady`. However, the engine and EngineFactory never call onContainerReady on any provider. A grep of non-test src shows no caller. Normal configuration-driven playback is unaffected, and only consumers who use the class directly and rely on this callback are hit. That makes it low rather than medium. It is not a duplicate: the confirmed 'VideoPositionSource init never settles on load error or blocked preload' is a different defect (the canplay/init promise).

**Repro test.** `given VideoPositionSource with a registered onContainerReady callback, when the player emits 'playing' (the event video.js 8 actually fires on first playback, with no 'firstplay'), then the container-ready callback is called`

### 71. [low] Chapter navigation before the first marker skips or reverses

[keyboard-step-source.ts:486](src/timelineproviders/position-sources/keyboard-step-source.ts#L486) · area: timeline-providers-adapters · reported severity: medium · verifier: opus

**Summary.** _findCurrentMarkerIndex returns 0 when the position is before every marker. _jumpToNextMarker then targets index 1, skipping marker 0, and _jumpToPreviousMarker targets marker 0, which moves forward.

**Failure scenario.** With markers [5, 10, 20] at position 0, pressing Down (next) jumps to 10, skipping chapter 5. Pressing Up (previous) at position 2 jumps forward to 5.

**Evidence.**

```ts
`private _findCurrentMarkerIndex(position: number): number { ... for (let i = this._markers.length - 1; i >= 0; i--) { if (position >= this._markers[i]) { return i; } } return 0; }`
_jumpToNextMarker: `targetIndex = currentMarkerIndex + 1;`
_jumpToPreviousMarker: `} else { targetIndex = currentMarkerIndex; }`
```

**Fix.** Have _findCurrentMarkerIndex return -1 when position < markers[0], and update the doc comment to match. In _jumpToNextMarker, -1 + 1 already gives index 0, so that branch works unchanged. In _jumpToPreviousMarker, add a check for currentMarkerIndex === -1 first: wrap to the last marker when wrapNavigation is on, otherwise do nothing. Also make sure the exactlyOnMarker check never reads markers[-1]. Add tests with markers [5,10,20] at position 0 and 2.

Original suggestion: Return -1 when position < markers[0]. In next, use targetIndex = currentIndex + 1 (index 0 from -1). In previous, use wrap or no-op when currentIndex is -1. Add tests for a position before the first marker.

**Verifier.** I traced the code and the bug holds. In src/timelineproviders/position-sources/keyboard-step-source.ts, _findCurrentMarkerIndex (lines 486-496) returns 0 when the position is below every marker. Its own doc comment says it does this on purpose ("Returns 0 if before first marker"), but the two callers don't handle that case.  - **Next marker (line 471):** _jumpToNextMarker sets targetIndex = 0 + 1. With markers [5,10,20] at position 0, Down jumps to 10 and skips marker 5. - **Previous marker (lines 430-446):** _jumpToPreviousMarker checks exactlyOnMarker with markers[0] === position, which is false at position 2. It then takes the "between markers" branch with targetIndex = 0, so Up moves forward to 5.  Nothing guards against this. The constructor (line 151) and doInit only copy and sort the markers. They never insert 0 or check that the first marker is at or below the current position. Positions start at 0, so any markers array whose first value is above 0 can trigger it.  Every chapter-navigation test in src/test/unit/timelineproviders/position-sources/keyboard-step-source.spec.ts (lines 607-739) uses markers that begin at 0, so the before-first-marker case is never tested.  This is not a duplicate of any confirmed bug, since none of them involve KeyboardStepSource.  I lowered the severity to low for three reasons. First, KeyboardStepSource is only exported as a public class from src/timelineproviders/index.ts; a search outside the source file and its tests found no other code that builds it from the JSON configuration. Second, it only matters when the first marker is above 0. Third, adding a marker at 0 avoids it.

**Repro test.** `given chapter-navigation source with markers [5, 10, 20] at position 0, when down arrow pressed, then position is 5 and onMarkerJump is called with (0, 5)`

### 72. [low] Keyboard backward wrap emits 'end', which the engine treats as timeline complete

[keyboard-step-source.ts:335](src/timelineproviders/position-sources/keyboard-step-source.ts#L335) · area: timeline-providers-adapters · reported severity: medium · verifier: opus

**Summary.** Stepping left from 0 with wrapNavigation (the default) jumps to the duration and emits the 'end' boundary. The engine maps 'end' to timelineComplete / 'timeline-complete', so an ordinary navigation keypress signals completion. In the other direction, step forward clamps inconsistently: from a fractional position near the end with wrap off, nothing happens, while the large step clamps to the duration.

**Failure scenario.** At position 0, pressing Left broadcasts 'timeline-complete', which triggers end-of-presentation event actions. With wrapNavigation=false, after seeking to 59.5 on a 60 s timeline, Right does nothing, so the end is unreachable by single steps.

**Evidence.**

```ts
`if (newPosition < 0) { if (this._wrapNavigation) { newPosition = duration; this.setPosition(newPosition); this.emitBoundary('end'); } ...`
`if (newPosition > duration) { if (this._wrapNavigation) { ... } // If clamping, do nothing (already at end)`
eligius-engine.ts: `if (boundary === 'end') { this._onCompleteCallback(); }`
```

**Fix.** In _handleStepBackward and _handleLargeStepBackward, when wrapping from the start to the duration, set the position without emitting 'end'. Emit emitBoundary('end') when a forward step lands exactly on the duration. In _handleStepForward with wrapNavigation=false, clamp newPosition to the duration and emit 'end' only if the position changed, matching _handleLargeStepForward. Update the spec test at keyboard-step-source.spec.ts:467 to match.

Original suggestion: Do not emit 'end' when wrapping backward (or emit 'start' semantics only for genuine boundary arrival). For a small step with wrap off, clamp to the duration as _handleLargeStepForward does.

**Verifier.** I traced the report through the code and it holds. KeyboardStepSource can be reached from a valid configuration: the resource importer imports `@timelineproviders/index.ts`, which exports it (src/timelineproviders/index.ts:25), and EngineFactory.createPositionSourceForTimeline instantiates whatever `positionSource.systemName` names (src/engine-factory.ts:268-277). `wrapNavigation` defaults to true (keyboard-step-source.ts:150).  In _handleStepBackward (keyboard-step-source.ts:329-336), any position below stepSize, including 0, plus Left gives newPosition < 0. The source then sets the position to the duration and calls emitBoundary('end'). _handleLargeStepBackward does the same at lines 365-369. The engine registers `onBoundaryReached` (src/eligius-engine.ts:390-392) and maps 'end' to _onCompleteCallback. That callback emits `timelineComplete` and broadcasts `timeline-complete` (eligius-engine.ts:407-411), and EngineEventbusAdapter.ts:84-85 broadcasts it again.  So a Left press near the start signals timeline completion. The source never emits 'end' when the user steps forward onto the duration (lines 313-323 emit nothing). So for keyboard timelines, `timeline-complete` fires only on a backward wrap and never on a real arrival at the end. That is inverted, not a deliberate design.  The unit test at keyboard-step-source.spec.ts:467-481 asserts that the source emits 'end' on a backward wrap. It checks the source in isolation and never considers how the engine reads 'end'. It shows the emission is deliberate at source level. It does not show the completion signal is intended.  The secondary claim also holds. With wrapNavigation=false, _handleStepForward does nothing when currentPosition + stepSize > duration (line 320). From 59.5 on a 60 s timeline, Right cannot reach the end, while _handleLargeStepForward clamps to the duration (lines 352-355).  It is not a duplicate. None of the confirmed bugs concern KeyboardStepSource boundary semantics. Severity is lowered because the keyboard source is opt-in and nothing inside the engine consumes `timeline-complete`. The damage is limited to user-configured event actions on `timeline-complete`, such as end-of-presentation logic, firing on an ordinary navigation keypress.

**Repro test.** `given an engine with a KeyboardStepSource timeline at position 0 and default wrapNavigation, when the Left arrow is pressed, then the 'timeline-complete' event is not broadcast`

### 73. [low] animate never resolves for an empty or multi-element selection

[animate.ts:70](src/operation/animate.ts#L70) · area: lens-performance · reported severity: medium · verifier: opus

**Summary.** jQuery invokes the animate complete callback once per element. An empty jQuery set never calls it, so the operation promise never settles and the rest of the action's operations never run, with no error. selectElement only warns and returns an empty set when nothing matches.

**Failure scenario.** startOperations [selectElement {selector:'#missing'}, animate {...}, addClass {...}]: animate hangs forever, addClass never runs, and action.start() never resolves. With 3 matched elements, the promise resolves after the first element finishes instead of all three. animateWithClass (line 34) hangs the same way when the class defines no animation, the class is already applied, or the set is empty, and it leaves the `.one` handlers attached.

**Evidence.**

```ts
animate.ts: `selectedElement.animate(animationProperties, animationDuration, () => { internalResolve(resolve, {}, operationData); });`; select-element.ts:10-12 `if (!element.length) { console.warn(`selector '${selector}' wasn't found!`); } return element;`
```

**Fix.** At the start of the promise executor, if `!selectedElement || selectedElement.length === 0`, call `internalResolve(resolve, {}, operationData)` and return. Otherwise call `selectedElement.animate(...)` with no per-element callback, then `.promise().then(() => internalResolve(resolve, {}, operationData))`. jQuery's `.promise()` resolves right away on an empty set and resolves once after all matched elements finish, which fixes both cases.

Original suggestion: Resolve immediately when selectedElement.length === 0. Use `selectedElement.animate(...).promise().then(...)` so it resolves when all elements finish. In animateWithClass add standard 'animationend', resolve immediately when getComputedStyle shows animation-name 'none', and use a timeout fallback.

**Verifier.** src/operation/animate.ts:61-72 resolves the operation promise only from jQuery's per-element `complete` callback. jQuery runs that callback once per matched element, so an empty set never calls it. I checked this against the installed jquery 4.0.0 in jsdom: `$('.missing').animate({opacity:0},10,cb)` never called cb, and a set of 3 elements called it 3 times. selectElement (src/operation/select-element.ts:10-13) only logs a console.warn on no match and returns the empty set. Nothing between the two checks `length`, so a selector that matches nothing leaves the animate promise pending forever, and the rest of the action's operations never run. No other code guards against this or adds a timeout. src/test/unit/operation/animate.spec.ts uses a mock whose animate always calls the callback, so the tests never cover an empty set. The multi-element half of the report is real but barely matters: every element shares the same duration and they finish together, and later resolve calls do nothing. The animateWithClass claims are a separate operation and I did not verify them here. I rated it low rather than medium because it only happens when a selector matches nothing, and there is already a console warning naming the selector. When it does happen, though, the action's remaining operations stop silently.

**Repro test.** `given selectedElement is an empty jQuery set, when animate operation is applied, then the returned promise resolves with the operation data instead of staying pending`

### 74. [low] editTimelineProviderSettings discards providers when settings are undefined

[configuration-factory.ts:251](src/configuration/api/configuration-factory.ts#L251) · area: configuration-tools · reported severity: medium · verifier: opus

**Summary.** When the factory wraps an existing configuration that has no timelineProviderSettings (the property is optional), the editor gets a fresh `{}` that is never attached to the configuration, so addProvider has no effect.

**Failure scenario.** new ConfigurationFactory(existingJsonWithoutTimelineProviderSettings).editTimelineProviderSettings().addProvider('animation'); getConfiguration().timelineProviderSettings is undefined (verified). The resolver then throws 'Configuration incomplete'.

**Evidence.**

```ts
return new TimelineProvidersSettingsEditor(
  this.configuration.timelineProviderSettings || {},
  this
);
```

**Fix.** In editTimelineProviderSettings(): `this.configuration.timelineProviderSettings ??= {}; return new TimelineProvidersSettingsEditor(this.configuration.timelineProviderSettings, this);`

Original suggestion: `this.configuration.timelineProviderSettings ??= {};` before constructing the editor.

**Verifier.** I traced the code and the report holds. In F:\projects\eligius\eligius\src\configuration\api\configuration-factory.ts:251, editTimelineProviderSettings() passes `this.configuration.timelineProviderSettings || {}` to TimelineProvidersSettingsEditor. When the property is undefined, the editor gets a fresh object that is never assigned back to the configuration. The property is optional in IEngineConfiguration (src\configuration\types.ts:75). TimelineProvidersSettingsEditor.addProvider (timeline-provider-settings-editor.ts:~45) writes `this.providersSettings[timelineType] = settings` into that detached object, so getConfiguration() still has no timelineProviderSettings. ConfigurationResolver.process (configuration-resolver.ts:49) then throws 'Configuration incomplete'. The constructor accepts an existing configuration, and the class JSDoc documents editing one that way without calling init(), so this is reachable through the public API. The existing unit test (configuration-factory.spec.ts:64) always calls init('nl-NL') first. init() fills the missing property through mergeIfMissing with timelineProviderSettings: {} (line 184), and the integration tests follow the same path, so none of them cover the failing case.  I lowered the severity to low because the trigger is narrow: the input must be a partial configuration without timelineProviderSettings, which the resolver would reject anyway, and the caller must skip init(). Calling init() first works around it, and the failure is loud (the resolver throws) rather than silent. This is not a duplicate of 'Action editors copy the action, so edits never reach the factory configuration'. That bug is an explicit deepCopy of an action. This one is an unattached default object for a missing optional property, so the defect is different.

**Repro test.** `given a ConfigurationFactory wrapping a configuration without timelineProviderSettings, when editTimelineProviderSettings().addProvider('animation') is called, then getConfiguration().timelineProviderSettings.animation is defined`

### 75. [low] Resolver mutates caller's config; config: placeholder depends on key order

[configuration-resolver.ts:264](src/configuration/configuration-resolver.ts#L264) · area: configuration-tools · reported severity: medium · verifier: opus

**Summary.** resolvePlaceholders rewrites the input IEngineConfiguration in place, and the existing tests assert this. The resolved config also shares references with the input (cssFiles, timeline spreads). Because config: placeholders read rootConfig while it is being mutated, a `config:` reference to a key that holds an unresolved template:/json: placeholder resolves to the raw placeholder string or to the resolved value, depending on property order.

**Failure scenario.** {id:'config:layoutTemplate', ..., layoutTemplate:'template:main'}. 'id' is visited before 'layoutTemplate', so resolved id is the literal string 'template:main', whereas reordering the keys yields the template HTML. Separately, an app that passes an imported JSON module to createEngine twice finds its module object permanently rewritten.

**Evidence.**

```ts
resolvePlaceholders(configuration, configuration, this.importer);
...
configFragment[key] = resolvePropertyChain(configProperty, rootConfig);
...
cssFiles: configuration.cssFiles,
```

**Fix.** Resolve in two passes: first template: and json: placeholders across the whole tree, then config: placeholders. Alternatively, when resolving a config: placeholder, resolve its target recursively if the target is still a placeholder string (with cycle detection). Leave the in-place mutation alone unless the existing specs are changed on purpose. If immutability is wanted, deepCopy at the top of process() and update the json:/template: specs to assert on the returned config.

Original suggestion: deepCopy the configuration first and resolve placeholders on the copy. Resolve template:/json: in a first pass and config: in a second, or resolve config: targets recursively. Optionally Object.freeze the resolved config, given the 'immutable after resolution' rule.

**Verifier.** I traced it through the code. The bug holds, but its impact is narrower than the report says.  1) In-place mutation is intended and covered by tests. ConfigurationResolver.process (src/configuration/configuration-resolver.ts:47) calls resolvePlaceholders(configuration, configuration, importer) on the caller's object. EngineFactory.createEngine (src/engine-factory.ts:170) passes the configuration through without copying it. The specs 'should resolve json: properties' and 'should resolve template: properties' in src/test/unit/configuration/configuration-resolver.spec.ts assert that the input config itself was rewritten (expect(config.layoutTemplate).toBe(...)). That half of the report is therefore documented-by-test behaviour, not a defect. Reusing a config is also mostly harmless: on a second process() call the placeholders are already resolved values that no longer start with config:/template:/json:, so resolution is effectively idempotent.  2) The order dependence is real. resolvePlaceholders walks Object.keys in insertion order (lines 248-250). A config: value is resolved at line 264 by resolvePropertyChain against rootConfig, which is the same object being mutated. If the target key comes later in iteration order and still holds 'template:x' or 'json:x', the config: reference gets the raw placeholder string. If the target comes earlier, it gets the imported value. Example: {id: 'config:layoutTemplate', ..., layoutTemplate: 'template:main'} gives id === 'template:main', while swapping the key order gives the template HTML. Nothing in the code orders the passes or resolves recursively.  Severity is low, not medium. It only shows up when a config: placeholder points at another placeholder, which no shipped config, doc or test does. Every default layout uses a plain layoutTemplate string. It is not a duplicate of any confirmed bug: the confirmed resolver item is about unknown operation names, and the resolvePropertyValues items are about the operation helper, not this resolver.

**Repro test.** `given config with id 'config:layoutTemplate' declared before layoutTemplate 'template:main', when ConfigurationResolver.process is called, then resolved id equals the imported template html and not the literal 'template:main'`

### 76. [low] Private events (@private) are dropped from the generated EventMap

[events-metadata-generator.ts:297](src/tools/code-generator/events-metadata-generator.ts#L297) · area: configuration-tools · reported severity: medium · verifier: opus

**Summary.** createEventMetadata returns null for @private interfaces, and toTypesFile only receives the non-private events, so private events disappear from AllEvents/EventMap/EventName. CLAUDE.md says to mark internal events @private to exclude them from metadata, which implies they stay typed for the eventbus. None exist today, so the bug is latent.

**Failure scenario.** Mark src/eventbus/events/request-engine-root.ts @private and run npm run events-metadata. eventbus.request('request-engine-root', ...) no longer type-checks because the name is missing from EventName.

**Evidence.**

```ts
if (isPrivateEvent(interfaceDeclaration)) {
  ...
  return null;
}
...
toTypesFile(project, eventData);
```

**Fix.** In the loop that runs createEventMetadata, keep two lists. Put every valid event interface (private ones included, as long as it has name/args) into allEvents, and only the non-private ones into publicEvents. Pass allEvents to toTypesFile and publicEvents to toIndexFile. To do this, change createEventMetadata so it returns a status instead of null for private events, or check isPrivateEvent in the loop before generating the metadata file. Do not write a metadata/<event>.ts file for private events.

Original suggestion: Collect all valid event interfaces for toTypesFile, and use the private filter only for the metadata files and metadata index.

**Verifier.** The trace holds. In F:\projects\eligius\eligius\src\tools\code-generator\events-metadata-generator.ts, createEventMetadata returns null for any interface carrying a @private JSDoc tag (lines 46-50). The collection loop at lines 280-285 only pushes truthy results into eventData, and that same filtered array goes to both toIndexFile (line 288) and toTypesFile (line 297). So a @private event is left out of AllEvents, EventMap and EventName in src/eventbus/events/types.ts. Every IEventbus method in src/eventbus/types.ts is constrained to `E extends EventName` (on/off/once/broadcast/broadcastForTopic/request...). That means a private event could no longer be broadcast or listened to without a type error. CLAUDE.md's "Adding an event" steps say to mark internal events @private "so they are excluded from metadata", and then run events-metadata to regenerate types.ts. That implies internal events stay typed for the bus. Only the metadata should skip them. I found no guard elsewhere that adds them back.  Why the severity is low: - Nothing triggers it today. No file in src/eventbus/events/ has a @private tag, and git history shows none ever did, so the bug is latent. - It lives in a dev-time code generator, not the runtime engine. - If it did fire, the result would be a loud `tsc` compile error at `npm run typecheck` or build time, not silent runtime breakage. - No configuration can reach it.  It does not duplicate any confirmed bug. The closest are the schema-generator bugs, which have a different root cause in a different generator.

**Repro test.** `given an event interface tagged @private in src/eventbus/events, when the events metadata generator runs, then the generated types.ts EventName union still includes that event's name but the metadata index does not export it`

### 77. [low] destroy() ends actions while the source still ticks, and aborts teardown on any error

[eligius-engine.ts:447](src/eligius-engine.ts#L447) · area: engine-core · reported severity: medium · verifier: sonnet

**Summary.** destroy() first awaits _cleanUp() (ending timeline and init actions) while the active position source is still active, so ticks keep firing actions during async end operations. Only after that does it destroy the sources. If any end operation rejects, destroy() rejects immediately: the locale manager, eventbus removers, position sources (the RAF loop) and the container are never torn down.

**Failure scenario.** Playing RAF timeline, destroy(): while an end operation awaits an animation, the next tick starts the action keyed at the next position, and it is never ended. Separately, an end operation throws (for example a selector that no longer matches), so destroy() rejects, the RAF loop keeps calling _onTimeHandler, and engine eventbus listeners stay registered on a shared bus.

**Evidence.**

```ts
async destroy() {
    await this._cleanUp();

    this.localeManager.destroy();
...
    this._eventbusRemovers.forEach(remover => remover());
```

**Fix.** At the start of destroy(), call this._activePositionSource?.deactivate(). Then wrap `await this._cleanUp()` in try/catch and remember the error. Run the rest of the teardown (localeManager.destroy, removers, positionSource.destroy, container.empty, emit 'destroyed', removeAllListeners) in a finally block. Rethrow the captured error afterwards.

Original suggestion: Deactivate the active source first. Wrap _cleanUp in try/finally (or collect errors) so the remaining teardown always runs, then rethrow an AggregateError.

**Verifier.** In src/eligius-engine.ts, destroy() (line 447) begins with `await this._cleanUp()`. _cleanUp runs _cleanUpTimeline and then ends the init actions. Nothing in destroy() deactivates the active position source before that. Only stop() and switchTimeline() (lines 192 and 263) call deactivate(), and destroy() does not. _executeActions awaits each action's end() in a plain for-loop with no try/catch. Action.start (and presumably end) logs the error and rethrows. So one rejecting end operation makes _cleanUp reject and destroy() reject immediately. localeManager.destroy, the eventbus removers, positionSource.destroy for each provider, container.empty and the 'destroyed' emit are all skipped. The RAF loop and the engine's eventbus listeners stay alive. The tick-while-ending claim holds as well: while the awaits yield, a RAF tick can start the next timeline action, which is never ended. The existing destroy() specs only cover the happy path. Severity: an end operation that throws needs a faulty or fragile config, for example a selector that no longer matches, but destroy() is a teardown path, so a leak is a real consequence. Medium is slightly high. Low-to-medium fits.

**Repro test.** `given an init action whose end operation rejects, when destroy is called, then destroy rejects but localeManager.destroy and every positionSource.destroy were still called`

### 78. [low] NavigationController._handleVideoComplete crashes on the last or unknown item

[navigation-controller.ts:196](src/controllers/navigation-controller.ts#L196) · area: controllers · reported severity: low · verifier: opus

**Summary.** navVidIdLookup[index] can be undefined, and navData.next is undefined for the last navigation item. Both are dereferenced unguarded inside an eventbus listener.

**Failure scenario.** The last navigation item has autoNext:true -> 'video-complete' for it -> TypeError reading 'videoUrlIndex' of undefined thrown from the eventbus broadcast.

**Evidence.**

```ts
const navData = this.navVidIdLookup[index];
    if (navData.autoNext) {
      this.eventbus?.broadcast('request-video-url', [
        navData.next.videoUrlIndex,
      ]);
```

**Fix.** In _handleVideoComplete: `const navData = this.navVidIdLookup[index]; if (navData?.autoNext && navData.next) { broadcast('request-video-url', [navData.next.videoUrlIndex]); } else { broadcast('request-video-cleanup', []); }`. This sends an unknown index or a last item with no next entry to cleanup instead of throwing.

Original suggestion: Guard with `if (!navData) return;` and `if (navData.autoNext && navData.next)`, and fall back to request-video-cleanup otherwise.

**Verifier.** I traced the code and found no guard. In src/controllers/navigation-controller.ts:194-203, _handleVideoComplete reads `this.navVidIdLookup[index]` and then reads `navData.autoNext` without checking that the entry exists. If autoNext is true it reads `navData.next.videoUrlIndex`. _buildNavigationData (lines 230-237) sets `nav.next = data.navigationData[index + 1]`, which is undefined for the last item when it has no nextId. That gives two crashes: 1. A 'video-complete' event with an index that has no navigation entry throws when it reads 'autoNext' of undefined. 2. A last item with autoNext:true throws when it reads 'videoUrlIndex' of undefined.  The handler is bound and registered through BaseController.addListener (base-controller.ts:51-58). Eventbus.broadcast (eventbus.ts:115) has no try/catch, so the TypeError reaches whoever called broadcast.  The existing tests in src/test/unit/controllers/NavigationController.spec.ts:272-299 only cover a middle item that has a next entry and an item with autoNext:false. Neither unhappy path is tested.  This is not a duplicate. None of the confirmed bugs concern NavigationController.  Why the severity stays low: - Nothing in the engine broadcasts 'video-complete'. Only consumer code or an external integration does, through the public eventbus API using the documented VideoCompleteEvent. - The navigation `json` is untyped (`any`), so "autoNext on the last item" is arguably a configuration mistake rather than a clearly valid configuration. - The failure is a thrown TypeError in one listener. It does not corrupt engine state.

**Repro test.** `given NavigationController whose last navigation item has autoNext true and no next item, when video-complete is broadcast for that item's videoUrlIndex, then it broadcasts request-video-cleanup and does not throw`

### 79. [low] NavigationController.detach leaves the menu DOM and jQuery handlers behind

[navigation-controller.ts:101](src/controllers/navigation-controller.ts#L101) · area: controllers · reported severity: low · verifier: opus

**Summary.** _buildHtml appends a <ul> with mouseup handlers to the container, but detach never removes it or the handlers. Detaching and re-adding the controller duplicates the menu and gives duplicate #nav_N ids. ctrlLookup also keeps references to the detached LabelControllers.

**Failure scenario.** removeControllerFromElement('NavigationController'), then addControllerToElement again on the same element -> two menus are rendered. $('#nav_0') matches the first, so highlighting targets the stale menu.

**Evidence.**

```ts
private _buildHtml(parentElm: JQuery, data: any) {
    const ul = $('<ul/>');
    data.forEach(this._addNavElement.bind(this, ul));
    parentElm.append(ul);
  }
```

**Fix.** Store the created <ul> in a private field in _buildHtml. In detach, call this.menuElement?.remove() (this also unbinds jQuery's mouseup handlers) and set the field to null. Also clear ctrlLookup (and optionally navLookup and navVidIdLookup) so the detached LabelControllers are not kept alive.

Original suggestion: Keep a reference to the created <ul>, call .remove() on it in detach (that also drops jQuery handlers), and clear ctrlLookup.

**Verifier.** I read src/controllers/navigation-controller.ts. attach() (line 55) calls _buildHtml, which creates a new <ul> with <a id='nav_N'> elements and binds jQuery mouseup handlers (lines 136-162), then appends it to the container. detach() (lines 101-112) removes the eventbus listeners via super.detach, detaches the LabelControllers, empties labelControllers, and nulls eventbus and container and window.onpopstate. It never keeps or removes the <ul>, and it does not clear ctrlLookup, navLookup or navVidIdLookup.  removeControllerFromElement (src/operation/remove-controller-from-element.ts:39-42) only splices the controller out of the element's data and calls detach. Nothing else removes the DOM it built. So after removeControllerFromElement('NavigationController'), the menu stays on the page. It no longer works: the eventbus is null, so the mouseup handler's `this.eventbus?.broadcast` does nothing, and its labels are no longer localised. If addControllerToElement then runs on the same element, a second <ul> with the same nav_N ids is appended, and _highlightMenu's `$('#nav_' + index)` (line 186) picks the first, stale copy.  NavigationController.spec.ts only checks that detach removes listeners, detaches labels and nulls references. No test asserts that the DOM is removed, and no guard elsewhere covers it.  The impact is small: you only see it if a configuration removes and re-adds this rarely used controller. The orphaned menu and leaked handlers do go against the CLAUDE.md rule to remove listeners and DOM references on detach. It is not a duplicate of any confirmed bug, so it stays low.

**Repro test.** `given an attached NavigationController that rendered its menu into the container, when detach is called, then the container no longer contains the generated ul or any #nav_N elements`

### 80. [low] Progressbar click seek uses event.target and rounds to whole seconds

[progressbar-controller.ts:59](src/controllers/progressbar-controller.ts#L59) · area: controllers · reported severity: low · verifier: opus

**Summary.** The click handler is on the container but measures event.target. A click on a child, such as a textElement inside the container, uses the child's rect and seeks to the wrong time. The result is also Math.round-ed to integer seconds, losing the engine's sub-second precision.

**Failure scenario.** The text label sits inside the progress container and the user clicks on it -> x is computed relative to the small label rect, so a click at 80% of the bar seeks to roughly 10%.

**Evidence.**

```ts
const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
...
      Math.round((this.duration / 100) * percentage),
```

**Fix.** Measure against event.currentTarget, which is the container the handler is bound to. Better still, capture the container in attach() and measure that: `const rect = container[0].getBoundingClientRect()`. Clamp the percentage to 0-100 and drop the Math.round, or round to 0.1s to match action precision. Optionally also set pointer-events:none on textElement.

Original suggestion: Use event.currentTarget, which is the container. Do not round, or round to 0.1s, the action precision.

**Verifier.** I traced this in F:\projects\eligius\eligius\src\controllers\progressbar-controller.ts.  In attach() (lines 37-44), the controller sets `pointer-events: none` on selectedElement and binds the click handler to selectedElement.parent(). That makes a click on the bar itself fall through to the container, so for the bar event.target === currentTarget, which is what the author intended. textElement gets no such treatment. textElement is a @dependency and the consumer decides where it goes. Overlaying the percentage label inside the bar's container is a normal layout, and in that case a click on the label makes event.target the label.  _clickHandler (lines 59-64) then calls event.target.getBoundingClientRect() and computes x and percentage against the label's small rect instead of the container's. Example: container 0-500px, label 400-440px, click at clientX 420 (84%). The handler computes x = 20 against width 40, which is 50%, so it seeks to half the duration. The same happens with any other child element in the container that lacks pointer-events:none. Nothing else guards against this.  Line 67 rounds the seek target to whole seconds. On a short timeline (for example 5s) clicks snap to 1-second steps, even though the engine and actions work at 0.1s precision.  The existing test (src\test\unit\controllers\ProgressbarController.spec.ts, 'should broadcast SEEK_REQUEST when parent container clicked') uses a mock event with only `target`. It never covers target !== currentTarget, so it does not prove the opposite.  This is not a duplicate: no confirmed bug concerns ProgressbarController. Severity stays low. It only happens with markup where a child that receives clicks sits inside the container, and the rounding only loses sub-second precision.

**Repro test.** `given a progressbar whose container also holds the text element and a 100s duration, when the text element (rect left 400, width 40) is clicked at clientX 420 inside a 500px-wide container, then timeline-seek-request is broadcast with 84 rather than 50`

### 81. [low] compareDate/formatDate reject the epoch timestamp 0

[compare-date.ts:45](src/operation/compare-date.ts#L45) · area: operations-a · reported severity: low · verifier: opus

**Summary.** A falsy check is used as the presence test, so the valid numeric timestamp 0 (1970-01-01) is reported as missing.

**Failure scenario.** compareDate {date1: 0, date2: Date.now()} throws 'compareDate: both dates are required'. formatDate {date: 0, format:'YYYY'} throws 'formatDate: date is required'.

**Evidence.**

```ts
compare-date.ts:45 `if (!date1 || !date2) {` ; format-date.ts:32 `if (!date) {`
```

**Fix.** Replace the falsy checks with nullish/empty checks: in compare-date.ts use `if (date1 == null || date1 === '' || date2 == null || date2 === '')`, and in format-date.ts use `if (date == null || date === '')`. Leave invalid-value rejection to the existing Number.isNaN(getTime()) checks.

Original suggestion: Check `date1 === undefined || date1 === null || date1 === ''`, and do the same in formatDate.

**Verifier.** I traced the code and the report holds. In F:\projects\eligius\eligius\src\operation\compare-date.ts, date1 and date2 are typed `Date | string | number` (lines 9 and 14). The presence check at line 45 is `if (!date1 || !date2)`, so the number 0, which is a valid Unix epoch timestamp, throws 'compareDate: both dates are required' before `new Date(0)` (line 49) gets a chance to build a valid date. F:\projects\eligius\eligius\src\operation\format-date.ts has the same falsy check at line 32 (`if (!date)`). No other guard or normalisation step changes the value before these checks. The existing specs (src\test\unit\operation\compare-date.spec.ts and format-date.spec.ts) only use 2025 dates and never pass 0, so no test proves the opposite. The empty string is also caught, which is fine, because `new Date('')` is invalid anyway. This is not a duplicate of any confirmed bug: none of them involve date operations or falsy presence checks. Severity is low. It only fires for the exact value 0, or for a date of exactly 1970-01-01T00:00:00Z passed as a number, which almost never happens in practice, and the failure is a loud throw rather than silent corruption.

**Repro test.** `given date1 is the epoch timestamp 0 and date2 is Date.now(), when compareDate is called, then it returns comparison -1 and isBefore true instead of throwing 'both dates are required'`

### 82. [low] animate tags animationEasing as ParameterType:boolean

[animate.ts:7](src/operation/animate.ts#L7) · area: operations-a · reported severity: low · verifier: opus

**Summary.** animationEasing is a jQuery easing name (string), but its metadata tag says boolean. Generated operation metadata and editor hints are wrong, so editors offer a checkbox for easing.

**Failure scenario.** Running npm run opers-metadata marks animationEasing as boolean, so a metadata-driven editor (Eligian) treats 'swing' or 'linear' as an invalid value.

**Evidence.**

```ts
/**
   * @type=ParameterType:boolean
   * @erased
   */
  animationEasing?: string;
```

**Fix.** In src/operation/animate.ts change the animationEasing doc tag to `@type=ParameterType:string`. There is no easing ParameterType in src/operation/metadata/types.ts, so adding one would be a separate, optional change. Then run `npm run opers-metadata` to regenerate src/operation/metadata/animate.ts.

Original suggestion: Change the tag to `@type=ParameterType:string` (or a dedicated easing ParameterType) and regenerate the metadata.

**Verifier.** The report holds. In src/operation/animate.ts lines 6-10, `animationEasing?: string` carries the tag `@type=ParameterType:boolean`. The generated src/operation/metadata/animate.ts (lines 11-14) faithfully emits `type: 'ParameterType:boolean'`. The runtime path at animate.ts:60-64 passes the value as the jQuery easing string, and the unit test (animate.spec.ts:31) uses a string. The JSON schema comes from the TS types, so I found no guard that would correct the metadata. Other operations use the boolean ParameterType only inside union types for genuinely polymorphic values (log.ts, set-variable.ts). This looks like a copy/paste slip in the doc tag. It is not a duplicate: none of the confirmed bugs is about operation metadata doc tags. The schema-generator entries are a different defect. Severity stays low. Runtime animation is unaffected; only metadata consumers such as the Eligian editor or a validator get a wrong type hint. That hint would reject or mis-present valid easing strings like 'swing' or 'linear'.

**Repro test.** `given the generated animate operation metadata, when reading properties.animationEasing.type, then it is 'ParameterType:string' (currently 'ParameterType:boolean')`

### 83. [low] formatText titlecase uppercases letters after apostrophes and non-ASCII letters

[format-text.ts:87](src/operation/format-text.ts#L87) · area: operations-a · reported severity: low · verifier: opus

**Summary.** `\b\w` treats apostrophes and non-ASCII letters as word boundaries, so it produces wrong title case for common text.

**Failure scenario.** formatText {textContent:"don't stop", transformation:'titlecase'} gives "Don'T Stop". 'émile zola' gives 'éMile Zola'.

**Evidence.**

```ts
text = text.replace(/\b\w/g, char => char.toUpperCase());
```

**Fix.** text = text.replace(/(?<![\p{L}\p{N}'’])\p{L}/gu, c => c.toUpperCase());

Original suggestion: Use `text.replace(/(^|\s)(\p{L})/gu, (m, s, c) => s + c.toUpperCase())`.

**Verifier.** The bug is real. At src/operation/format-text.ts:87, titlecase runs text.replace(/\b\w/g, ...). The regex has no u flag, so \w only matches [A-Za-z0-9_]. That means an apostrophe or a non-ASCII letter counts as a word boundary. I ran the exact regex in Node: "don't stop" gives "Don'T Stop" and "émile zola" gives "éMile Zola". Nothing guards against this. formatText takes any string as textContent, and the only titlecase test (format-text.spec.ts:75) uses plain ASCII input. The TypeDoc says titlecase capitalises the first letter of each word, so this output contradicts the documented behaviour. None of the confirmed bugs covers it. Severity stays low: the output is cosmetic, it only appears for text with apostrophes or accented letters, and it never affects engine state. The suggested fix /(^|\s)(\p{L})/gu has a gap: a word that follows punctuation without a space, such as "(hello", or a word that starts with a digit would not be capitalised. Matching a letter that has no letter or apostrophe before it is a closer fit.

**Repro test.** `given textContent "don't stop" and transformation titlecase, when formatText runs, then formattedText is "Don't Stop" (and "émile zola" becomes "Émile Zola")`

### 84. [low] NavigationController builds id attr from config via HTML string; _initHistory dead

[navigation-controller.ts:235](src/controllers/navigation-controller.ts#L235) · area: lens-security-robustness · reported severity: low · verifier: opus

**Summary.** videoUrlIndex from configuration JSON is interpolated into an HTML string and into a selector. `this._initHistory.bind(this)` creates a bound function and throws it away, so the initial menu highlight from the URL never happens.

**Failure scenario.** navigationData item with videoUrlIndex "1' onmouseover='alert(1)" -> injected handler on the anchor. Loading page#/someId never highlights the matching menu item, because _initHistory is never called.

**Evidence.**

```ts
const a = $(`<a href='javascript:;' id='nav_${data.videoUrlIndex}'/>`);
...
    this._buildHtml(this.container, this.navigation);
    this._initHistory.bind(this);
```

**Fix.** At line 145, build the anchor with $('<a/>').attr({href: '#', id: `nav_${data.videoUrlIndex}`}). Keep a Map from videoUrlIndex to the anchor element and use it in _highlightMenu instead of the `#nav_${index}` selector. At line 56, replace the bind with `this._initHistory();`. Inside _initHistory, guard the lookup: `const nav = navId ? this.navLookup[navId] : undefined; const videoIndex = nav?.videoUrlIndex ?? 0; this.activeNavigationPoint = this.navVidIdLookup[videoIndex];`.

Original suggestion: Create the anchor with $('<a/>').attr({href:'#', id:`nav_${idx}`}), and select it by element reference instead of a '#nav_' selector. Call this._initHistory() (with the guard from the routing finding) or delete it.

**Verifier.** I traced both halves of the report through F:\projects\eligius\eligius\src\controllers\navigation-controller.ts and both hold. The report's line number (235) points at the wrong place; the real defects are at lines 56 and 145.  (1) Line 56 has `this._initHistory.bind(this);`. This creates a bound function and throws it away, so `_initHistory` (lines 59-68) is never called anywhere. As a result, attach() never sets `activeNavigationPoint` and never highlights the menu item that matches the URL hash (or index 0). Until the first navigate-to-video-url event or click, `request-current-navigation` therefore returns null and no menu item has the `current-menu-item` class. None of the tests guards this. src\test\unit\controllers\NavigationController.spec.ts has no assertions on initHistory, current-menu-item or nav_ ids.  (2) Line 145 interpolates `data.videoUrlIndex` straight into an HTML string: `$(`<a href='javascript:;' id='nav_${data.videoUrlIndex}'/>`)`. Line 186 also uses it unescaped in a selector. A videoUrlIndex such as "1' onmouseover='alert(1)" injects an attribute. No sanitisation or type check exists in _buildNavigationData (lines 222-249). The `json` field is typed `any`, so the schema does not constrain it either.  This is low severity. The injection needs control of the configuration JSON, and the configuration author is already trusted to build DOM through operations. It still breaks the CLAUDE.md rule to sanitize content before inserting it into the DOM. The dead `_initHistory` only loses the initial highlight and initial navigation state, and the legacy NavigationController is rarely used.  One caveat about the fix: calling `_initHistory()` as it stands would crash with a TypeError when the hash names an unknown id, because line 64-65 reads `nav.videoUrlIndex` with nav undefined. So it must not be re-enabled without a guard.  This is not a duplicate. No confirmed bug concerns NavigationController.

**Repro test.** `given navigation data with videoUrlIndex 0 and an empty location hash, when NavigationController is attached, then the nav_0 anchor has class current-menu-item and request-current-navigation returns the first navigation item`

### 85. [low] HTTP operations double-prefix their own error messages and drop the cause

[http-delete.ts:79](src/operation/http-delete.ts#L79) · area: operations-b · reported severity: low · verifier: opus

**Summary.** The HTTP-status error is thrown inside the same try block, so the catch wraps it again. The original error is also discarded rather than passed as `cause`, which loses the stack and error type (for example a network TypeError versus an AbortError).

**Failure scenario.** Server returns 400 -> message is 'httpPost: httpPost: HTTP error 400 Bad Request'. The spec only checks toContain('HTTP error 400'), so it passes.

**Evidence.**

```ts
throw new Error(
        `httpDelete: HTTP error ${response.status} ${response.statusText}`
      );
...
  } catch (error) {
    throw new Error(`httpDelete: ${(error as Error).message}`);
```

**Fix.** In http-delete.ts, http-post.ts and http-put.ts, keep only the fetch call inside the try block. On catch, throw new Error(`httpX: ${(error as Error).message}`, {cause: error}). Do the response.ok check and body parsing after the try, so the HTTP-status error is thrown once with a single prefix. Tighten the specs to assert the exact message, for example toBe('httpDelete: HTTP error 403 Forbidden'), and to check that error.cause is set for fetch rejections.

Original suggestion: Move the status check outside the try, or rethrow errors that already carry the prefix, and use new Error(msg, {cause: error}). Apply to http-delete, http-post and http-put.

**Verifier.** I traced the code in src/operation/http-delete.ts and the bug holds. When the response is not OK, line 61 throws `httpDelete: HTTP error <status> <statusText>` inside the try block that opens at line 52. The catch at line 78-79 then wraps it as `httpDelete: ${error.message}`, so the final message reads 'httpDelete: httpDelete: HTTP error 403 Forbidden'. The catch builds a new Error without `cause`, so the original stack and error type are lost. That matters most for network failures (TypeError) and aborts (AbortError). http-post.ts (lines 71/82-83) and http-put.ts (lines 71/82-83) have the same structure. I found no guard that rethrows already-prefixed errors. The specs (http-delete.spec.ts:116, http-post.spec.ts:80, http-put.spec.ts:79) only assert toContain('HTTP error NNN'), so they pass despite the doubled prefix. Any valid configuration that calls these operations against a failing endpoint triggers it. The impact is cosmetic and diagnostic only: the operation still throws, the status is still set, and engine state is unaffected. So the severity stays low. None of the confirmed bugs concern the HTTP operations, so this is not a duplicate.

**Repro test.** `given fetch resolves with status 403 Forbidden, when httpDelete is called, then the thrown error message is exactly 'httpDelete: HTTP error 403 Forbidden' without a doubled prefix`

### 86. [low] loadJson ignores HTTP status and treats falsy cached JSON as a cache miss

[load-json.ts:46](src/operation/load-json.ts#L46) · area: operations-b · reported severity: low · verifier: opus

**Summary.** loadJson never checks response.ok. A 404 or 500 returns an HTML error page that fails in json() with a parse error that names neither the URL nor the status, and the operation name is missing from the message. The cache test is a truthiness check, so cached values like 0, false, '' or null are refetched every time.

**Failure scenario.** loadJson {url:'/missing.json'} -> 404 -> 'Unexpected token < in JSON' with no URL. loadJson {url, cache:true} for a body of `false` -> a network request on every call.

**Evidence.**

```ts
if (cache && jsonCache[url]) {
...
  const response = await fetch(url);
  const json = await response.json();
```

**Fix.** After fetch: `if (!response.ok) throw new Error(`loadJson: HTTP ${response.status} for ${url}`);`, and wrap `response.json()` so a parse failure is rethrown with `loadJson` and the URL in the message. Change the cache check to `if (cache && Object.hasOwn(jsonCache, url))`, or use a Map with `.has(url)`. Do not use plain `url in jsonCache` on a `{}` object, because it also matches inherited keys such as 'constructor'.

Original suggestion: Check response.ok and throw `loadJson: HTTP ${status} for ${url}`. Use `url in jsonCache` for the cache check.

**Verifier.** Traced src/operation/load-json.ts. Line 46 is `if (cache && jsonCache[url])`, a truthiness check, so a cached body of false, 0, '' or null counts as a miss and is fetched again on every call. Lines 51-52 call `fetch(url)` and then `response.json()` without checking `response.ok` or `status`. I found no wrapper elsewhere that adds the URL or the operation name to the error. On a 404 or 500 with an HTML body, the operation rejects with a bare JSON parse error that names neither the URL nor `loadJson`. That breaks the CLAUDE.md rule that operations throw with the operation name and the relevant data. A worse case the report missed: an error response whose body is valid JSON (for example `{"error":"not found"}`) is silently accepted as data and, with `cache:true`, cached for good. The spec at src/test/unit/operation/load-json.spec.ts stubs `fetch` with an object that has only `json()`, with no `ok` or `status`, so nothing covers either path. Severity stays low. A failed request still raises an error, just one that is hard to diagnose. The falsy-cache case only costs an extra request and still returns the right value, and a JSON resource whose whole body is falsy is unusual. This is not a duplicate: no confirmed bug touches load-json.

**Repro test.** `given fetch resolves with ok:false and status 404, when loadJson runs with url '/missing.json', then it rejects with an error mentioning loadJson, 404 and '/missing.json'`

### 87. [low] replaceText miscounts replacements for non-global regex with capture groups

[replace-text.ts:76](src/operation/replace-text.ts#L76) · area: operations-b · reported severity: low · verifier: opus

**Summary.** For a regex without the g flag, String.match returns [fullMatch, ...groups], so matches.length counts capture groups even though only one replacement happens.

**Failure scenario.** replaceText {textContent:'ab12', searchPattern:/(\d)(\d)/, replacement:'X'} -> textContent 'abX', replacementCount 3 (expected 1).

**Evidence.**

```ts
const matches = textContent.match(searchPattern);
    count = matches ? matches.length : 0;
```

**Fix.** In the RegExp branch, count real matches without group noise: `count = searchPattern.global ? [...textContent.matchAll(searchPattern)].length : (textContent.search(searchPattern) >= 0 ? 1 : 0);`. `matchAll` copies the regex internally and `search` ignores and restores lastIndex, so global/sticky lastIndex state does not leak. Alternatively, count inside a replacer callback: `newText = textContent.replace(searchPattern, (...a) => { count++; return ...; })`, which preserves `$1`-style substitution only if done carefully, so the matchAll/search approach is simpler.

Original suggestion: count = searchPattern.global ? (textContent.match(searchPattern)?.length ?? 0) : (searchPattern.test(textContent) ? 1 : 0). Reset lastIndex for sticky or global regexes.

**Verifier.** Traced src/operation/replace-text.ts:74-78. When searchPattern is a RegExp, the count comes from `textContent.match(searchPattern).length`. For a regex without the g flag, String.prototype.match returns an exec-style array of [fullMatch, ...captureGroups], so /(\d)(\d)/ against 'ab12' gives length 3. `replace` with a non-global regex replaces only once, so the result is textContent 'abX' with replacementCount 3. Nothing upstream normalises the pattern or adds the g flag: there is no `new RegExp` anywhere except validate-form.ts. The existing tests in src/test/unit/operation/replace-text.spec.ts cover only string patterns and a global regex, so none of them proves the opposite. The RegExp branch is part of the documented contract: the type is `string | RegExp`, the generated metadata lists RegExp, and the TypeDoc says regex is supported "with global flag for multiple replacements", which implies a non-global regex is valid and should replace (and count) once. Reachability is limited: a JSON configuration cannot hold a RegExp, so this only happens through a direct call to the exported operation, the fluent ConfigurationFactory with an in-memory RegExp, or a regex placed in operation data by an earlier operation. Only the reported count is wrong; the replacement itself is correct. That makes it low severity. Not a duplicate: no confirmed bug involves replaceText.

**Repro test.** `given textContent 'ab12' and non-global regex /(\d)(\d)/ with replacement 'X', when replaceText is applied, then textContent is 'abX' and replacementCount is 1`

### 88. [low] Property chain resolution throws on falsy-but-valid intermediate values

[get-property-chain-value.ts:39](src/operation/helper/get-property-chain-value.ts#L39) · area: operations-b · reported severity: low · verifier: opus

**Summary.** The guard `!currentInstance` treats '', 0 and false as unresolvable, so chains that read a property of a primitive falsy value throw.

**Failure scenario.** when {expression:'$operationdata.text.length==0'} with text '' -> throws "Property chain 'text.length' cannot be resolved." (confirmed via getPropertyChainValue(['a','length'], {a:''})).

**Evidence.**

```ts
if (!currentInstance) {
      throw new Error(
        `Property chain '${chain.join('.')}' cannot be resolved.`
      );
```

**Fix.** Replace the guard with `if (currentInstance === null || currentInstance === undefined)`. That keeps the clear error for null or undefined intermediates and lets primitives such as '', 0 and false be indexed. Add spec cases for ['a','length'] on {a:''} returning 0, and for ['a','b'] on {a:null} still throwing.

Original suggestion: Use `currentInstance === null || currentInstance === undefined` as the guard.

**Verifier.** src/operation/helper/get-property-chain-value.ts:39 guards each reduce step with `if (!currentInstance) throw`. That check runs before every segment is read, so any falsy primitive in the middle of a chain ('' , 0, false) throws "Property chain '...' cannot be resolved." even though reading a property of it is valid JS ('' .length === 0, (0).toFixed exists). It is reachable from configuration: resolve-external-property-chain.ts:34 passes `$operationdata.*` chains straight to getPropertyChainValue, and when.ts:94-106 resolves both sides of an expression that way. So `when {expression: '$operationdata.text.length==0'}` throws when text is ''. The same thing happens through `$scope.currentItem.length` on an empty-string loop item, and through resolvePropertyValues for any operation property. I found no guard elsewhere: resolveExternalPropertyChain only handles null or undefined for the whole value, not intermediate segments. get-property-chain-value.spec.ts has no tests for falsy values. This is not a duplicate. The confirmed property-chain entries cover prototype pollution, Function-constructor reach and resolvePropertyValues writing into the source, all different defects. Severity is low: it needs a falsy intermediate value plus a property read on a primitive, which is an edge case, but the error is thrown and breaks the action's operation chain.

**Repro test.** `given an empty-string intermediate value, when getPropertyChainValue(['a','length'], {a: ''}) is called, then it returns 0 instead of throwing`

### 89. [low] Storage operations keep `key` despite it being tagged @erased

[load-from-storage.ts:77](src/operation/load-from-storage.ts#L77) · area: operations-b · reported severity: low · verifier: opus

**Summary.** Both storage operations tag `key` as @erased, which feeds the generated metadata and editors, but neither removes it. The stale key then leaks into later operations, for example a following saveToStorage that omits key silently reuses it.

**Failure scenario.** loadFromStorage {key:'a', storageType:'local'} -> saveToStorage {value: 1, storageType:'local'} with no key: it writes to 'a' instead of failing with 'key is required'.

**Evidence.**

```ts
removeProperties(operationData, 'storageType');  // load-from-storage.ts:77
removeProperties(operationData, 'value', 'storageType');  // save-to-storage.ts:67
```

**Fix.** Erase `key` in both operations: `removeProperties(operationData, 'key', 'storageType')` in loadFromStorage and `removeProperties(operationData, 'key', 'value', 'storageType')` in saveToStorage. Add 'key' to both Omit<> output types. Add spec assertions that the erased properties are absent from the returned data. (If keeping `key` was intended, remove the @erased tags instead and regenerate the metadata.)

Original suggestion: Erase 'key' in both operations and update the Omit<> output types. Otherwise drop the @erased tag. Add specs.

**Verifier.** The trace holds. In F:\projects\eligius\eligius\src\operation\load-from-storage.ts, `key` is tagged `@required @erased` (lines 7-10), but line 77 only calls `removeProperties(operationData, 'storageType')`, and the output type is `Omit<..., 'storageType'>`. In F:\projects\eligius\eligius\src\operation\save-to-storage.ts, `key` is also tagged `@erased` (lines 7-10), but line 67 only removes `value` and `storageType`. No other code erases `key`. The specs (src\test\unit\operation\load-from-storage.spec.ts and save-to-storage.spec.ts) never check whether `key` is still there after the operation runs, so no test proves or disproves the erasure. The generated metadata therefore tells editors and the Eligian DSL that `key` is gone afterwards, which is false, and the stale `key` stays in operationData for the rest of the chain.  The reported failure scenario is weaker than stated. A `saveToStorage` without `key` breaks the `@required` contract, so the generated JSON schema rejects it. The leak only does damage when a configuration skips validation, or when a later operation reads a `key` property as a dependency. The real defect is the mismatch between the metadata and the runtime behaviour, plus the operation data leaking into later operations. It is not a reachable silent-write bug from a valid configuration. Severity stays low.

**Repro test.** `given loadFromStorage with key 'a' and storageType 'local', when the operation runs, then the returned operation data has no 'key' property`

### 90. [low] t() with locale override leaves rosetta switched if the translation function throws

[locale-manager.ts:99](src/locale/locale-manager.ts#L99) · area: eventbus-locale-util · reported severity: low · verifier: opus

**Summary.** t() mutates rosetta's global locale for an override and restores it without try/finally. If a function-valued translation throws (rosetta calls val(params)), the restore never runs. Every later t() call then returns the override locale's strings while this._locale still reports the old one. rosetta.t already accepts a lang argument, so the switching is unnecessary.

**Failure scenario.** Current locale is en-US. t('greeting', undefined, 'nl-NL') runs, and the nl-NL greeting is a function that throws on missing params. After that, t('nav.home') returns the Dutch string while manager.locale === 'en-US'.

**Evidence.**

```ts
if (locale && locale !== this._locale) {
      this._rosetta.locale(targetLocale);
    }
...
    const result = this._rosetta.t(key, params) ?? '';

rosetta: t(key, params, lang) { var val = dlv(tree[lang || locale], key, ''); if (typeof val === 'function') return val(params);
```

**Fix.** Remove the temporary locale switching. Call this._rosetta.t(key, params, targetLocale) directly, since rosetta accepts a lang argument. Also make _getRawTranslation use targetLocale, so that debug-mode interpolation checks look at the override locale's data and not this._locale.

Original suggestion: Drop the locale switching and call this._rosetta.t(key, params, targetLocale).

**Verifier.** I traced the report through the code and it holds. In src/locale/locale-manager.ts, t() calls this._rosetta.locale(targetLocale) at around line 99 when a locale override is passed. Next comes this._rosetta.t(key, params) at line 107, and only after that is the locale restored (lines 110-112). There is no try/finally around this.  rosetta's t() (node_modules/rosetta/dist/index.mjs) calls val(params) when the value is a function and does not catch errors. Function values are a documented and typed part of the public API: TLocaleData in src/locale/types.ts allows `(params) => string`, LocaleManager is exported publicly through src/index.ts -> locale/index.ts, and locale-manager.spec.ts (T025) tests function translations. That same test's function reads params.formal, so it throws when params is undefined, which is the exact failure in the report.  If the function throws, rosetta's internal locale stays on the override. Later t() calls without an override then return strings in the override language while manager.locale still reports the old locale. Nothing outside t() resets rosetta's locale. Only setLocale would, and the caught exception does not trigger it.  The severity is still low. JSON configurations cannot contain functions, and the only internal caller (locale-eventbus-adapter.ts:105) never passes an override. So this needs programmatic use of loadLocale with a translation function that throws, plus t() with a locale override. It is not a duplicate: the confirmed locale bugs are about setLocale/change recursion and LocaleLoader not being wired, which are different defects.

**Repro test.** `given current locale en-US and an nl-NL function translation that throws, when t() is called with a nl-NL override and throws, then a later t() call without an override still returns the en-US string`

### 91. [low] loadLocale merge is shallow: nested keys from earlier loads are lost

[locale-manager.ts:72](src/locale/locale-manager.ts#L72) · area: eventbus-locale-util · reported severity: low · verifier: opus

**Summary.** ILocaleManager.loadLocale is documented as 'Load or merge locale data', but rosetta.set does Object.assign(tree[lang], table), which is a shallow merge. A second load that shares a top-level namespace replaces that namespace completely. In debug mode, _rawLocaleData is overwritten rather than merged, so the interpolation check reads only the last chunk.

**Failure scenario.** loadLocale('en-US', {nav: {home: 'Home'}}); loadLocale('en-US', {nav: {about: 'About'}}); t('nav.home') returns ''.

**Evidence.**

```ts
loadLocale(locale: TLanguageCode, data: TLocaleData): void {
    this._rosetta.set(locale, data);

rosetta: set(lang, table) { tree[lang] = Object.assign(tree[lang] || {}, table); }
```

**Fix.** In loadLocale, deep-merge the existing table with the new data before calling rosetta.set. Read the current table with this._rosetta.table(locale), use a recursive merge that skips the __proto__, constructor and prototype keys, and pass the merged result to set. Apply the same merge to _rawLocaleData in debug mode. Add a unit test that loads two chunks sharing a namespace.

Original suggestion: Deep-merge existing and new data (for example from rosetta.table(locale)) before calling set, or change the doc to say 'replace top-level keys'.

**Verifier.** The report holds. I traced it as follows. LocaleManager.loadLocale (src/locale/locale-manager.ts:72) passes the data straight to rosetta.set. In node_modules/rosetta/dist/index.js:8, set does `tree[lang] = Object.assign(tree[lang] || {}, table)`, which merges only the top level. The public interface (src/locale/types.ts:146-150) says the method will "Load or merge locale data. Can be called after initialization to add translations." and calls the argument "Translation data to merge".  The failure path: call loadLocale('en-US', {nav: {home: 'Home'}}), then loadLocale('en-US', {nav: {about: 'About'}}). The second call replaces the whole `nav` object, so t('nav.home') comes back as ''. In debug mode, line 77 also overwrites _rawLocaleData instead of merging it, so the interpolation check only sees the last chunk.  I looked for a guard and found none. LocaleManager does no merging of its own, and no test covers a second load for the same locale (I searched locale-manager.spec.ts and locale-integration.spec.ts).  It is not a duplicate. The confirmed bug "LocaleLoader is never wired" is about $ref locale entries; this one is about how repeated loads combine.  Severity stays low. The engine's own path (src/engine-factory.ts:187-190) calls loadLocale once per locale from the configuration's `locales` object, and that object cannot hold two entries for the same locale, so a valid configuration never hits this. Only a consumer who calls the documented public method a second time, on the localeManager that createEngine returns, loses nested keys. Top-level keys that are not shared still merge correctly.

**Repro test.** `given en-US loaded with {nav: {home: 'Home'}}, when loadLocale is called again with {nav: {about: 'About'}}, then t('nav.home') still returns 'Home'`

### 92. [low] setLocale ignores documented fallback for unavailable locales

[locale-manager.ts:186](src/locale/locale-manager.ts#L186) · area: eventbus-locale-util · reported severity: low · verifier: opus

**Summary.** The interface promises 'Falls back to default locale if requested locale is unavailable'. The implementation switches to any code, even one that was never loaded, and every t() then returns ''. Only LocaleEventbusAdapter checks availability; direct callers through the public LocaleManager API get no protection. The default locale is not stored, so no fallback is possible.

**Failure scenario.** localeManager.setLocale('fr-FR') with only en-US and nl-NL loaded. A change event fires with 'fr-FR', and all labels re-render as empty strings.

**Evidence.**

```ts
setLocale(locale: TLanguageCode): void {
    const previousLocale = this._locale;
    this._locale = locale;
    this._rosetta.locale(locale);

types.ts: "Falls back to default locale if requested locale is unavailable."
```

**Fix.** In the constructor, store options.defaultLocale in a readonly _defaultLocale. In setLocale, check availability first. If the requested locale is not in _availableLocales (and at least one locale is loaded), log a warning and use _defaultLocale instead. Fix the equality guard in the same edit: return early when the resolved locale equals _locale. The alternative is to drop the fallback sentence from the ILocaleManager JSDoc so the contract matches the code.

Original suggestion: Store options.defaultLocale. In setLocale, if !this._availableLocales.has(locale), warn and use the default, or change the documented contract to match.

**Verifier.** I traced the failure through the real code and it holds. ILocaleManager.setLocale in src/locale/types.ts:139 documents "Falls back to default locale if requested locale is unavailable". LocaleManager.setLocale (src/locale/locale-manager.ts:185-197) never checks this._availableLocales. It assigns the locale, calls rosetta.locale(locale) and emits 'change'. The constructor (line 42) also never keeps options.defaultLocale anywhere except in _locale, which setLocale overwrites, so a fallback is impossible after the first switch.  After setLocale('fr-FR') with only en-US and nl-NL loaded, t() calls rosetta.t, which returns '' for a locale with no tree. Every label then renders empty.  The only guard is in LocaleEventbusAdapter (src/adapters/locale-eventbus-adapter.ts:84-90). It covers the eventbus 'language-change' path only, and it does not fall back either: it warns and returns. Direct callers of the localeManager that EngineFactory.createEngine returns get no protection. That return value is documented public API.  Tests: the only "fallback" test is in locale-eventbus-adapter.spec.ts:170-190, and it tests the adapter with a mocked manager. No LocaleManager unit test proves the fallback.  This is not a duplicate. The confirmed "setLocale always emits 'change'" bug is the missing equality guard, which is a separate defect in the same method. This one is the missing availability check and the default locale that is never stored.  Severity stays low. It only triggers when a caller passes a locale that was never loaded, through the direct API. The common eventbus path already rejects it, and the result is empty labels, not a crash.

**Repro test.** `given LocaleManager with defaultLocale en-US and only en-US and nl-NL loaded, when setLocale('fr-FR') is called, then locale is en-US and t('greeting') returns the en-US translation`

### 93. [low] Debug interpolation check reads the current locale, not the override locale

[locale-manager.ts:161](src/locale/locale-manager.ts#L161) · area: eventbus-locale-util · reported severity: low · verifier: opus

**Summary.** _getRawTranslation always uses this._locale, so with a locale override in t() the missing-variable check inspects the wrong locale's string. It produces false warnings, or misses real ones.

**Failure scenario.** Debug on, current en-US 'hi' = 'Hello', nl-NL 'hi' = 'Hallo {{name}}'. t('hi', {}, 'nl-NL') logs no missing-variable warning even though name is missing.

**Evidence.**

```ts
const localeData = this._rawLocaleData.get(this._locale);
```

**Fix.** Add a locale parameter to _getRawTranslation(key, locale) and to _checkMissingInterpolationVars(key, params, locale). In t(), call this._checkMissingInterpolationVars(key, params, targetLocale), and have _getRawTranslation read this._rawLocaleData.get(locale).

Original suggestion: Pass targetLocale into _checkMissingInterpolationVars and _getRawTranslation.

**Verifier.** In src/locale/locale-manager.ts, t() works out targetLocale = locale ?? this._locale and switches rosetta to it (lines ~95-100). It then calls this._checkMissingInterpolationVars(key, params) without passing targetLocale. That calls _getRawTranslation(key), which at line 161 reads this._rawLocaleData.get(this._locale), so it always looks at the current locale and never the override. Nothing else guards this: the check runs only when debug is on and params are given, and it gets no locale information. The override parameter is documented public API ("Optional locale override"), and debug mode stores raw data for every loaded locale, so the override locale's raw data is present but never read. The reported scenario holds. Debug on, en-US current with 'hi'='Hello', nl-NL with 'hi'='Hallo {{name}}': t('hi', {}, 'nl-NL') finds no {{...}} in 'Hello' and logs no warning. The reverse case logs a false warning. This is not a duplicate: the confirmed setLocale/language-change recursion is a different defect. The impact is limited to developer console warnings in debug mode and does not change translation output, so severity stays low.

**Repro test.** `given debug LocaleManager with current en-US 'hi'='Hello' and nl-NL 'hi'='Hallo {{name}}', when t('hi', {}, 'nl-NL') is called, then console.warn reports missing interpolation variable 'name'`

### 94. [low] RAF emits 'end' before final position; last-position actions skipped when looping

[raf-position-source.ts:156](src/timelineproviders/position-sources/raf-position-source.ts#L156) · area: timeline-providers-adapters · reported severity: low · verifier: opus

**Summary.** On reaching the duration, _onTick emits 'end' first and then setPosition(duration), so the engine runs the position-duration actions after 'timeline-complete'. In loop mode, position `duration` is never emitted, so actions keyed at the last position never run. The non-loop path then calls deactivate(), which resets the position to 0.

**Failure scenario.** For a 3 s timeline with an action starting at 3 (or a TimelineAction ending at 3): in non-loop mode its operations run after 'timeline-complete' listeners have already run; in loop mode they never run.

**Evidence.**

```ts
`if (newPosition >= duration) { this.emitBoundary('end'); if (this.loop) { this._startTimeOffset = time; this.setPosition(0); this.emitBoundary('start'); } else { this.setPosition(duration); this.deactivate(); } }`
```

**Fix.** In _onTick's end branch, call setPosition(duration) before emitBoundary('end') in both branches (while the state is still 'active', so callbacks fire). Then for loop mode set _startTimeOffset, setPosition(0) and emitBoundary('start'); for non-loop mode call deactivate(). Add a spec that records the interleaved order of position and boundary callbacks.

Original suggestion: Call setPosition(duration) before emitBoundary('end') in both branches.

**Verifier.** The report matches the code. In RafPositionSource._onTick (src/timelineproviders/position-sources/raf-position-source.ts:156-170), when newPosition >= duration the source calls emitBoundary('end') first. In loop mode it then calls setPosition(0) and never emits `duration`. In non-loop mode it calls setPosition(duration) only after the end boundary, and then deactivate(), which sets _position = 0 (base-position-source.ts:147). The engine maps the 'end' boundary straight to _onCompleteCallback (eligius-engine.ts:390-393), which emits 'timelineComplete' and broadcasts 'timeline-complete'. setPosition(duration) only reaches _onTimeHandler afterwards (eligius-engine.ts:780), so actions keyed at the duration run after the completion listeners. In loop mode the duration key is never reported, so a TimelineAction ending at the timeline duration is never ended and one starting there never starts. The spec at src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts:388 even comments 'position 3 -> loop -> position 0'. No test checks whether the duration position comes before or after the end boundary.  Duplicate check: the confirmed 'Skipped or backward positions...' and 'Actions only fire when ... exactly equals a configured key' bugs are engine-side dispatch defects in eligius-engine.ts. This is a separate source-side ordering defect, and an engine interval-crossing fix would not correct the non-loop ordering, so it is not a duplicate. It overlaps in effect with the loop-wrap case, which an interval-crossing engine fix should also handle.  Severity: low. The configuration is valid (an action ending at the timeline duration), but in non-loop mode the operations still run, only after 'timeline-complete'. The loop-mode loss affects only actions keyed exactly at the duration. The confirmed absolute-timestamp RAF bug also currently masks all of this in real use.

**Repro test.** `given a 3s RafPositionSource with loop true, when a tick at 3000ms elapsed arrives, then the position callback receives 3 before the boundary callback receives 'end'`

### 95. [low] ScrollPositionSource ignores existing scroll on activate and seek while suspended

[scroll-position-source.ts:107](src/timelineproviders/position-sources/scroll-position-source.ts#L107) · area: timeline-providers-adapters · reported severity: low · verifier: opus

**Summary.** startTicking only attaches the listener and does not emit the current scroll-derived position. deactivate (from the base class) resets _position to 0 but leaves the element scrolled and _lastPosition/_wasAtStart stale. seek() while suspended scrolls the element but returns the requested, unclamped value without updating the position, because the listener is detached.

**Failure scenario.** After a page reload with restored scroll at 50%, activate() leaves the engine at position 0 until the user scrolls, so actions for 0 to 50% never run. engine.stop() then start() gives position 0 while the element is still at 50%. While paused, seek(30) scrolls but getPosition() stays at the old value, so the engine's seekComplete reports the stale position. seek(-5) returns -5.

**Evidence.**

```ts
`protected startTicking(): void { if (!this._element) { return; } this._boundScrollHandler = this._handleScroll.bind(this); this._element.addEventListener('scroll', ...); }`
`async seek(position: number): Promise<number> { if (!this._element || this.state === 'inactive') { return this.getPosition(); } ... this._element.scrollTo({top: targetScrollTop, behavior: 'smooth'}); return position; }`
```

**Fix.** In startTicking, after attaching the listener, compute p = this._calculatePosition(), set this._lastPosition = p and this._wasAtStart = p === 0, then call this.setPosition(p). In seek, clamp position to [0, duration]. When state is not 'active', also call setPosition(clamped) and update _lastPosition, so a paused seek is reflected right away. Override deactivate to reset _lastPosition = 0 and _wasAtStart = true. Whether it should also scroll the element to 0 is a design choice.

Original suggestion: In startTicking, call setPosition(this._calculatePosition()) and sync _lastPosition/_wasAtStart. Override deactivate to reset those fields (and optionally scroll to 0). Clamp in seek and set the position directly when not active.

**Verifier.** Traced in src/timelineproviders/position-sources/scroll-position-source.ts. startTicking (107-116) only attaches the scroll listener and never calls setPosition(_calculatePosition()), so activate() over an element that is already scrolled (browser scroll restoration, or stop() then start() via base deactivate at base-position-source.ts:136-147, which zeroes _position but leaves the element scrolled and _lastPosition/_wasAtStart stale) reports position 0 until the next scroll event. seek() while suspended (state !== 'inactive' passes the guard at line 138) scrolls the element, but the listener was removed in stopTicking, so _position does not change. EligiusEngine.seek (eligius-engine.ts:228) then reads getPosition() and emits seekComplete/timeline-seeked/time with the old position. Nothing in startTicking catches up on resume, so the stale value lasts until the user scrolls again. One part of the report is refuted: seek(-5) returning -5 cannot happen through the engine, because eligius-engine.ts:211 rejects out-of-range positions and the engine ignores the source's return value anyway. This is not a duplicate. No confirmed entry covers ScrollPositionSource activation or sync. The 'RAF position not anchored to resume/seek' entry is the same class of bug but a separate defect in a different source. Severity is low to medium. Scroll timelines are configurable through timelineProviderSettings ('ScrollPositionSource'). Under normal use the user's next scroll self-corrects the position. The visible failures are a wrong position after restored scroll or stop/start, and a stale seekComplete position after a paused seek.

**Repro test.** `given element already scrolled to 50% before activate, when ScrollPositionSource.activate() is called, then getPosition() returns half the duration instead of 0; and given a suspended scroll source, when engine.seek(30) is called, then seekComplete reports position 30`

### 96. [low] Scroll end boundary needs exact equality with max scroll; fractional scrollTop misses it

[scroll-position-source.ts:178](src/timelineproviders/position-sources/scroll-position-source.ts#L178) · area: timeline-providers-adapters · reported severity: low · verifier: opus

**Summary.** 'end' fires only when scrollTop / (scrollHeight - clientHeight) * duration >= duration. With browser zoom or high-DPI scaling, scrollTop at the bottom is often a fraction below the integer max (for example 899.5 against 900), so the end boundary, and loop restart, never fire.

**Failure scenario.** At 110% zoom the user scrolls to the bottom; the computed position is 59.97 of 60, so no 'timeline-complete' and no loop reset happen.

**Evidence.**

```ts
`if (position >= duration && previousPosition < duration) { this.emitBoundary('end'); ...`
`return this._element.scrollHeight - this._element.clientHeight;`
```

**Fix.** In _handleScroll, treat the timeline as at the end when scrollableHeight - scrollTop < 1. In that case set position to duration, and clamp the computed position to [0, duration] before setPosition and the boundary checks.

Original suggestion: Treat scrollTop >= scrollableHeight - 1 as the end (snap to duration), and clamp position to [0, duration].

**Verifier.** Traced F:\projects\eligius\eligius\src\timelineproviders\position-sources\scroll-position-source.ts. _calculatePosition (lines 201-215) returns scrollTop / (scrollHeight - clientHeight) * duration, with no snapping or tolerance. _handleScroll (line 178) emits 'end', and runs the loop reset at lines 181-187, only when position >= duration. MDN documents that Element.scrollTop is not rounded while scrollHeight and clientHeight are integers. It recommends `Math.abs(scrollHeight - clientHeight - scrollTop) < 1` as the reliable bottom check because the exact comparison fails under zoom and fractional device pixel ratios. Under those conditions the maximum scrollTop can sit a fraction below scrollHeight - clientHeight, so position never reaches duration. 'end' never fires, and looping scroll timelines never reset. Nothing elsewhere guards against this: BasePositionSource.emitBoundary (base-position-source.ts:203) only relays the boundary, and nothing clamps or snaps the value. The spec (src/test/unit/timelineproviders/position-sources/scroll-position-source.spec.ts, around lines 234 and 527) tests only exact integer scrollTop values at max, so it neither covers nor contradicts this. No confirmed bug concerns ScrollPositionSource boundaries, so this is not a duplicate. Severity stays low. It needs a non-integer zoom or DPR, which is common but environment-dependent, and it affects only end-boundary and loop behaviour on scroll timelines. Positions and actions still update.

**Repro test.** `given active ScrollPositionSource with scrollHeight 1000 and clientHeight 100, when scrollTop is 899.5 and a scroll event fires, then the boundary callback is called with 'end'`

### 97. [low] request-current-timeline-position returns -1 at position 0

[eligius-engine.ts:760](src/eligius-engine.ts#L760) · area: lens-performance · reported severity: low · verifier: opus

**Summary.** The handler uses `||` for its fallback, so a valid position of 0 is reported as -1.

**Failure scenario.** At timeline start (position 0), a controller or operation that requests 'request-current-timeline-position' receives -1, which looks like 'no timeline'.

**Evidence.**

```ts
`resultCallback(floor(this._activePositionSource?.getPosition() || -1));`
```

**Fix.** Change the handler to `resultCallback(floor(this._activePositionSource?.getPosition() ?? -1));`. Optionally remove the identity `floor` parameter bound at line 495.

Original suggestion: Use `?? -1`, and drop the identity `floor` parameter.

**Verifier.** The bug holds. src/eligius-engine.ts:760 does `resultCallback(floor(this._activePositionSource?.getPosition() || -1))`, and line 494 registers that handler for the documented public event 'request-current-timeline-position' (src/eventbus/events/request-current-timeline-position.ts, args [callback]). When the active position source reports 0, which it does after init and before start, or after stop() or seek(0), the falsy 0 is replaced by -1. That is the same sentinel the existing test at src/test/unit/eligius-engine.spec.ts:960 uses for "no active provider", so a caller cannot tell the two apart.  Nothing guards against this. The handler has no special case for 0, and the only engine-side test checks 5.7 and the case with no provider. EngineEventbusAdapter (src/adapters/engine-eventbus-adapter.ts:144) registers a separate onRequest handler that returns engine.position correctly. That path is reached through eventbus.request(), not through the broadcast-with-callback path, so it does not hide the engine bug. No operation or controller in src consumes this event, so only external code calling the broadcast API sees the problem. It is not a duplicate of any confirmed bug. Severity stays low: it is a wrong value at one boundary position, from a public API with no internal callers.

**Repro test.** `given initialized engine whose position source reports 0, when request-current-timeline-position is broadcast, then callback receives 0 not -1`

### 98. [low] Duplicate action names silently overwrite each other in actionsLookup

[configuration-resolver.ts:94](src/configuration/configuration-resolver.ts#L94) · area: configuration-tools · reported severity: low · verifier: opus

**Summary.** actionsLookup is keyed by action.name with last-wins semantics. Two actions or event actions with the same name raise no error, and startAction/request-action by name silently reaches only the last one.

**Failure scenario.** actions:[{name:'Show',...},{name:'Show',...}]. request-action 'Show' always returns the second action, and the first can never be started by name.

**Evidence.**

```ts
.reduce<Record<string, IAction>>(
  (aggr, action) => ({
    ...aggr,
    [action.name]: action,
  }),
  {}
);
```

**Fix.** In ConfigurationResolver.process, build actionsLookup with a loop instead of the spread-reduce, and throw on a key that is already present. The error message should name both clashing JSON paths (actions[i] / eventActions[j]). Alternatively, document that action names must be unique across actions and eventActions, and validate that in the resolver. The loop also removes the O(n^2) object copying the spread-reduce does now.

Original suggestion: Throw on duplicate names, naming both JSON paths (actions[i], eventActions[j]).

**Verifier.** I traced the path through the code and it holds as reported. In F:\projects\eligius\eligius\src\configuration\configuration-resolver.ts lines 94-102, regular actions are concatenated with event actions and reduced into a Record keyed by action.name. When two actions share a name, the later spread entry wins and nothing reports the clash. EngineFactory stores this map as _actionsLookup (src/engine-factory.ts:174), and its 'request-action' handler reads _actionsLookup[systemName] at line 124. So requestAction and the DOMEventListenerController (dom-event-listener-controller.ts:64) only ever reach the last action with a given name.  I found nothing that rules the state out: - No uniqueness check exists anywhere in src/configuration or engine-factory.ts. - The JSON schema has no uniqueItems or uniqueness constraint. - IActionConfiguration.name is documented as "Human-readable name for the action" (types.ts:407). Only `id` is described as unique. That makes duplicate names a valid configuration.  There is also a related case: event actions are merged into the same map, so an event action whose name matches a regular action silently shadows it for request-action. Because event actions come after regular actions in the concat, the event action wins.  This is not a duplicate of any confirmed entry. "Resolver accepts unknown operation names" is a different defect in the same file.  Severity stays low. The failure needs an author to reuse a name, nothing crashes, and the only effect is that the wrong action is reached by name. Configurations with unique names, which is the normal case, are unaffected.

**Repro test.** `given two actions configured with the same name 'Show', when ConfigurationResolver.process is called, then it throws an error naming the duplicate action name (today it silently returns a lookup where 'Show' maps only to the second action)`

### 99. [low] Generators write metadata index for failed files and still exit 0

[metadata-generator.ts:482](src/tools/code-generator/metadata-generator.ts#L482) · area: configuration-tools · reported severity: low · verifier: opus

**Summary.** toIndexFile exports a metadata function for every operation file before generation runs. createOperationMetadata only console.errors and returns on failure, and the script prints 'Ready.' with exit code 0. The index can then reference metadata files that were never written, and a build passes the generation step only to fail later in tsc/tsdown with a confusing error. ctrls-metadata-generator.ts behaves the same way.

**Failure scenario.** Add src/operation/foo.ts whose export has no TOperation<...> type args. The generator logs an error, writes index.ts with `export {foo} from '@operation/metadata/foo.ts'`, and exits 0. npm run build later fails on the missing module.

**Evidence.**

```ts
toIndexFile(
  project,
  operationFiles.map(f => f.getBaseName())
);

operationFiles.forEach(createOperationMetadata);
project.saveSync();

console.log('Ready.');
```

**Fix.** Change createOperationMetadata (and createControllerMetadata) to return a boolean. Run generation first, collect the base names that succeeded, and pass only those to toIndexFile. After project.saveSync(), if any file failed, print the list of failures and call process.exit(1) instead of logging 'Ready.'. This makes `npm run build` stop at the metadata step.

Original suggestion: Build the index from successfully generated files only, track failures, and process.exit(1) when any file fails.

**Verifier.** The trace holds in F:\projects\eligius\eligius\src\tools\code-generator\metadata-generator.ts.  - Lines 482-485: toIndexFile writes `export {x} from '@operation/metadata/<file>'` for every file in src/operation/*.ts except index.ts and types.ts. It does this before any metadata is generated. - Lines 61-128: every failure branch in createOperationMetadata (no exported statement, no declaration, no type reference, no generics, unresolvable type name, type that is neither an interface nor an alias) only calls console.error and returns. The metadata file is never written. - Lines 487-490: project.saveSync() and console.log('Ready.') run unconditionally. There is no process.exit(1), so the exit code is 0. - ctrls-metadata-generator.ts (lines 431-469) follows the same index-then-generate pattern.  I found no guard, and nothing under src/test covers it: src/tools is excluded from tests and coverage.  Why the severity stays low and this is not a runtime bug: - No Eligius configuration or public engine API can reach it. It only fires when a developer adds a malformed operation source file and runs `npm run metadata`. - The failure is not silent. The generator prints a specific console.error, and tsc/tsdown then fails with "Cannot find module '@operation/metadata/foo.ts'", which names the file. - The real cost is that the build fails at a later step than it should, so this is a fail-fast and CI hygiene issue.  It is not a duplicate. The closest confirmed bug, "Schema generator skips 8 operations", concerns the JSON schema generator, which is a different script with a different defect.

**Repro test.** `given an operation file whose exported const has no TOperation generic, when the operation metadata generator runs, then it exits non-zero and metadata/index.ts does not export that operation`

### 100. [low] Operation README never shows descriptions and links to missing schemas

[generate-readmes.ts:121](src/tools/doc-tools/generate-readmes.ts#L121) · area: configuration-tools · reported severity: low · verifier: opus

**Summary.** Operations are TypeDoc variables (kind 32) without signatures, so getFirstCommentLine always returns '' and the README has no summaries. The schema link is generated for every operation, including the 8 that have no schema file, which gives 404 links. replaceAll(EOL) also misses '\n' on Windows, where EOL is '\r\n'.

**Failure scenario.** src/operation/README.md lists '- [addClass](...addClass.html) - ([schema](...))' with no title text, and '- [endWhen]...end-when.json' points at a non-existent schema.

**Evidence.**

```ts
const signature = itemInfo.signatures?.find(
  (x: any) => x.name === itemInfo.name
);
... `([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/${camelCaseToDash(itemInfo.name)}.json))`
```

**Fix.** In getFirstCommentLine, use itemInfo.comment?.summary when the reflection has no matching signature. Join all the summary text/code parts rather than taking only the first, and replace /\r?\n/g with a space. In generateLink, emit the schema link only when fs.existsSync(path.resolve(__dirname, '../../../jsonschema/operations', `${camelCaseToDash(name)}.json`)) is true. Fixing the schema generator bug, which is already confirmed separately, would also remove the 8 dead links.

Original suggestion: Read itemInfo.comment?.summary for variables, emit the schema link only when jsonschema/operations/<name>.json exists, and replace /\r?\n/g.

**Verifier.** I traced this through the code and checked the README the script generates. In F:\projects\eligius\eligius\src\tools\doc-tools\generate-readmes.ts, writeOperationsReadMe filters the docs.json children to kind 32 (variables) at line 40. getFirstCommentLine (lines 120-133) only looks at itemInfo.signatures. TypeDoc puts a variable's comment on the reflection itself, at itemInfo.comment, not on a signature, so for operations it always returns ''. The checked-in F:\projects\eligius\eligius\src\operation\README.md shows the result: every entry is just '- [addClass](...addClass.html) - ([schema](...))', with no description. The schema links are unconditional (line 108). I compared every link in README.md against jsonschema/operations/, and 8 point at files that do not exist: add-globals-to-operation, break-for-each, clear-storage, continue-for-each, end-for-each, end-when, otherwise and set-operation-data. Those 8 broken links are only a downstream symptom of the already-confirmed bug 'Schema generator skips 8 operations, so valid configs fail the oneOf'. The missing descriptions are a separate defect in this file, so the report is not a duplicate. The EOL point (replaceAll with '\r\n' on Windows misses '\n') is plausible, but it is unreachable for operations today because the code never finds a signature for them. This is a dev-time documentation generator (npm run generate-readmes). No configuration can trigger it and it has no runtime effect, so the severity is low.

**Repro test.** `given docs.json with an operation variable reflection whose comment.summary is 'Adds the class name to the selected element.', when generate-readmes writes the operations README, then the addClass entry contains that summary text`

### 101. [low] Seeking onto an exact key while playing runs start-only actions twice

[eligius-engine.ts:223](src/eligius-engine.ts#L223) · area: engine-core · reported severity: low · verifier: opus

**Summary.** When the source is active, ISeekable.seek calls setPosition, which drives _onTimeHandler and runs actions[seekPosition]. _executeSeekActions then starts every inactive action whose range covers the position. TimelineAction sets _active only when it has endOperations, so actions without endOperations pass both paths.

**Failure scenario.** RAF timeline playing, action {start: 5, end: 8, startOperations: [selectElement, setElementContent append]} with no endOperations. seek(5) appends the content twice. The same double run happens after seek-while-paused followed by start(), because seek never updates _lastPosition and RAF's startTicking re-emits the current position.

**Evidence.**

```ts
if (isSeekable(this._activePositionSource)) {
      await this._activePositionSource.seek(seekPosition);
    }
    await this._executeSeekActions(seekPosition);
...
      this._active = Boolean(this.endOperations.length);
```

**Fix.** Set `this._lastPosition = seekPosition` in seek() before calling `source.seek()`, so `_onTimeHandler` dedupes the emitted position. `_executeSeekActions` then stays the single start path for seeks. Do the same in the switchTimeline `timeline-firstframe` seek branch. Separately, consider tracking 'started' in TimelineAction independently of endOperations (for example, set `_active = true` on start and make end() a no-op when there are no end operations), so other dispatch paths cannot double-start start-only actions either.

Original suggestion: Set _lastPosition = seekPosition before calling source.seek, so the position callback is deduped, and let _executeSeekActions be the single path that starts actions on seek.

**Verifier.** I traced the reported path through the real code and it holds.  1. EligiusEngine.seek (src/eligius-engine.ts:222-226) awaits `RafPositionSource.seek` and then calls `_executeSeekActions(seekPosition)`. 2. `RafPositionSource.seek` (raf-position-source.ts:118-123) calls `setPosition(clamped)`. While the source is 'active', `BasePositionSource.setPosition` (base-position-source.ts:189-195) runs every onPosition callback synchronously. 3. That callback is `_onTimeHandler` (eligius-engine.ts:780-790). It only skips when `_lastPosition === pos`, and seek never updates `_lastPosition`. So for a new position it calls `_executeActionsForPosition(5)`, which runs `actions[5]`, the bound start method of the action whose `duration.start` is 5. 4. `TimelineAction.start` (src/action/timeline-action.ts:24-27) sets `_active = Boolean(this.endOperations.length)`. With no endOperations, `_active` stays false. 5. `_executeSeekActions` (eligius-engine.ts:802-811) then uses `_getActionsForPosition` (733-740), which keeps every action that is `!action.active` and whose range covers the position. The action passes that filter and is started a second time.  Actions with endOperations are protected, because `_active` is set to true synchronously before `super.start`, so the second path filters them out. The double run therefore only hits start-only actions. Those are valid and common: endOperations may be empty, and an append-style `setElementContent` is a typical case.  I found no guard against this. The existing seek tests (src/test/unit/eligius-engine.spec.ts:379-415, 840+) use a mocked position source whose `seek` never emits a position, so they never exercise the double path.  This is not a duplicate. The confirmed entries 'Skipped or backward positions...' and 'RAF position not anchored...' are different defects: one is about missing starts or ends across skipped positions, the other about position bookkeeping in the RAF source. This one is a double start caused by two dispatch paths and the `_active` flag depending on endOperations.  The second scenario in the report (seek while paused, then start()) also holds. `startTicking` calls `setPosition(getPosition())` while the source is active and `_lastPosition` is stale.  Severity is low. It needs an exact-key seek on a start-only action with a non-idempotent operation.

**Repro test.** `given a playing RAF timeline with a start-only action at {start: 5, end: 8}, when seek(5) is called, then the action's start operations run exactly once`

### 102. [low] seek(NaN) passes the bounds check, sets position to NaN and ends all active actions

[eligius-engine.ts:211](src/eligius-engine.ts#L211) · area: engine-core · reported severity: low · verifier: opus

**Summary.** The range guard uses `<` and `>`, and both are false for NaN. RafPositionSource.seek clamps with Math.max/min, which returns NaN. In _executeSeekActions every active action fails the range test and is ended, and no action is started.

**Failure scenario.** A ProgressbarController or custom code broadcasts 'timeline-seek-request' with a value computed from a zero-width element (0/0 = NaN). All visible actions are torn down, engine.position becomes NaN, and seekComplete/time are emitted with NaN.

**Evidence.**

```ts
if (seekPosition < 0 || seekPosition > duration) {
      return currentPosition;
    }
```

**Fix.** At the top of EligiusEngine.seek, reject non-finite input with `if (!Number.isFinite(position) || position < 0 || position > duration) return currentPosition;`. As defence in depth, RafPositionSource.seek and ScrollPositionSource.seek should also ignore non-finite values instead of clamping NaN through. ProgressbarController._clickHandler should skip the broadcast when rect.width is 0 or the computed value is not finite.

Original suggestion: Reject non-finite input: `if (!Number.isFinite(seekPosition) || seekPosition < 0 || seekPosition > duration)`.

**Verifier.** I traced the mechanism through the real code and it holds. In src/eligius-engine.ts:211 the guard is `seekPosition < 0 || seekPosition > duration`, and both comparisons are false for NaN, so NaN gets through. Next, RafPositionSource.seek (raf-position-source.ts:120) clamps with Math.max(0, Math.min(NaN, d)), which returns NaN, and then calls setPosition(NaN). In _executeSeekActions (eligius-engine.ts:802-811), the filter `!(start <= NaN && end >= NaN)` is true for every active action, so all of them are ended. _getActionsForPosition(NaN) matches nothing, so no action starts. seekComplete, timeline-seeked and timeline-time are then emitted with NaN. No test in src/test covers NaN seeks.  The trigger is weak, though. The ProgressbarController initialises duration to 0, not undefined. A real click on a zero-width element cannot normally happen. The click handler only produces NaN when the click event is synthetic and has no clientX (for example jQuery `.trigger('click')`), or when width is 0 and x is 0. Otherwise NaN has to come from user code calling engine.seek(NaN) or broadcasting 'timeline-seek-request' with NaN. The public API accepts it without validation, and the guard is clearly meant to reject invalid input, so this is a real but defensive gap. A valid configuration does not reach it, so severity stays low.

**Repro test.** `given an active timeline with a running action, when engine.seek(NaN) is called, then the position stays unchanged, no actions are ended and seekStart is not emitted`

### 103. [low] init() is not idempotent and crashes with a TypeError for an empty timelines array

[eligius-engine.ts:336](src/eligius-engine.ts#L336) · area: engine-core · reported severity: low · verifier: opus

**Summary.** `timelines?.[0].uri` throws a TypeError when timelines is [], before the intended 'No timelines present' check. Calling init() a second time (for example after destroy) appends every action method to _timeLineActionsLookup again and registers duplicate eventbus listeners and source callbacks, because neither lookup is cleared.

**Failure scenario.** Config with `timelines: []`: init() throws 'Cannot read properties of undefined (reading uri)' synchronously instead of rejecting with 'No timelines present'. init() twice: every timeline action's start and end runs twice per key.

**Evidence.**

```ts
this._currentTimelineUri = timelines?.[0].uri ?? '';

    this._createTimelineLookup();
```

**Fix.** Change line 336 to `this._currentTimelineUri = timelines?.[0]?.uri ?? '';`. Alternatively, make init() async or move the `!timelines?.length` check to the top of init(), so every no-timeline case rejects with 'No timelines present'. Optionally add `minItems: 1` to the schema for timelines.

Original suggestion: Use `timelines?.[0]?.uri`. Clear _timeLineActionsLookup and _timelineLookupCache at the start of _createTimelineLookup (or guard against re-init), and make destroy() reset them.

**Verifier.** Confirmed only for the empty-array half, and at low severity. In src/eligius-engine.ts:336, init() runs `this._currentTimelineUri = timelines?.[0].uri ?? ''`. The optional chain only covers `timelines` itself. When timelines is [], `timelines[0]` is undefined and reading `.uri` throws a TypeError. init() is not an async function, so this throws synchronously before _initializeTimelineProvider (line 361) can reject with 'No timelines present'.  An empty array is valid input. The generated schema (jsonschema/eligius-configuration.json, "timelines" property) has no minItems. The documented IEngineConfiguration example in src/configuration/types.ts:65 and in the schema itself even uses `timelines: []`. The resolver (configuration-resolver.ts:138) maps [] to [], and the factory does not reject it.  The existing tests do not cover this case. src/test/unit/eligius-engine.spec.ts:591 sets timelines to null, and src/test/integration/engine-smoke.spec.ts:179 sets it to undefined. Both of those short-circuit at `timelines?.`, so they reject correctly. [] does not.  Impact is small. The engine fails either way, and only the error type and message change (TypeError instead of 'No timelines present'). The failure is also synchronous instead of a rejection, which breaks only `engine.init().catch(...)`-style callers, not `await` callers.  The double-init half is not established. Calling init() twice, or after destroy(), is not a documented lifecycle. destroy() also tears down the locale manager and the emitter listeners, so re-init is not a supported path. I did not count that half. This is not a duplicate of any confirmed bug.

**Repro test.** `given a configuration with timelines set to an empty array, when engine.init() is called, then it rejects with 'No timelines present' instead of throwing a TypeError synchronously`

### 104. [low] animateWithClass leaves four stale jQuery handlers per run

[animate-with-class.ts:34](src/operation/animate-with-class.ts#L34) · area: lens-lifecycle-memory · reported severity: low · verifier: opus

**Summary.** jQuery `.one()` with several space-separated types removes only the handler for the type that fired. When the animation finishes, one prefixed alias fires, and handlers remain for the other four types, each holding a closure over operationData and resolve. Elements that are re-animated (looping timelines, repeated event actions) collect them without bound. If no animation runs, the promise never resolves and all five handlers stay.

**Failure scenario.** A looping 10 s timeline runs animateWithClass on a persistent '#title' element every loop. After N loops, '#title' has 4N jQuery handlers whose closures retain old operationData objects.

**Evidence.**

```ts
selectedElement.one(
          'webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd',
          () => {
            if (removeClass) {
              selectedElement.removeClass(className);
            }
            internalResolve(resolve, {}, operationData);
          }
        );
```

**Fix.** Bind only the standard event with a named handler and remove it explicitly. Use `const h = () => { selectedElement.off('animationend', h); if (removeClass) selectedElement.removeClass(className); internalResolve(resolve, {}, operationData); }; selectedElement.on('animationend', h);`. Drop the prefixed and camelCase aliases: 'animationEnd' is wrong-cased and never matches, and 'animationend' is supported in every target browser. Optionally also listen for 'animationcancel' with the same handler, removing both bindings, so the promise settles when the animation is interrupted.

Original suggestion: Listen to the standard 'animationend' with a named handler and remove it explicitly: `const h = () => {selectedElement.off('animationend', h); ...}`. Optionally add an animationcancel or timeout fallback.

**Verifier.** src/operation/animate-with-class.ts:34 binds one handler to five space-separated event types with selectedElement.one(...). In the installed jQuery 4.0.0 (node_modules/jquery/dist/jquery.js:4632-4642), .one wraps the handler so it calls jQuery().off(event) when it fires. off(event) (jquery.js:5408-5418) removes only handleObj.origType, the one type that fired. The other four bindings stay. jQuery documents this: with several types, the handler runs once per type.  In practice none of the four leftovers ever fires. Browsers dispatch the standard 'animationend'. jQuery event types are case-sensitive, so the 'animationEnd' binding never matches it. With no 'animationend' listener registered, Chrome, Safari and Firefox fall back to the legacy 'webkitAnimationEnd' alias, and 'oanimationend', 'oAnimationEnd' and 'msAnimationEnd' are dead in modern browsers. So each completed run removes the webkitAnimationEnd binding and leaves four handlers, each holding a closure over operationData and resolve. A persistent element animated on every loop of a looping timeline, or by a repeated event action, therefore gains four handlers per run. Both of those are valid configurations.  Nothing guards against this. No detach or off call exists, and the operation runs no end operation that cleans up. The unit test (src/test/unit/operation/animate-with-class.spec.ts) uses a MockElement whose one() stores a single handler, so it never exercises real jQuery handler bookkeeping and says nothing either way.  This is not a duplicate: no confirmed entry covers animateWithClass or event-handler cleanup. Severity stays low. The leak is small, a few closures per run, the animation itself still works, and it only grows on long-running looping timelines.

**Repro test.** `given a real jQuery element in jsdom, when animateWithClass runs and 'webkitAnimationEnd' is triggered, then no animation-end handlers remain bound (jQuery._data(el, 'events') has no remaining keys); today 'oanimationend', 'oAnimationEnd', 'msAnimationEnd' and 'animationEnd' remain`

### 105. [low] VideoPositionSource init timer and seek promise are not released on destroy

[video-position-source.ts:112](src/timelineproviders/position-sources/video-position-source.ts#L112) · area: lens-lifecycle-memory · reported severity: low · verifier: opus

**Summary.** doInit schedules videojs() creation in an untracked setTimeout, and doDestroy does not cancel it. A destroy before the timer fires removes the element first, and then videojs() is called on a missing id. seek() waits on player.one('seeked'). If the player is disposed mid-seek, the promise never settles, and engine.seek() and its awaiting callers hang.

**Failure scenario.** Call engine.destroy() (or switch away) synchronously after engine.init() starts on a mediaplayer timeline. The 0 ms timer fires after doDestroy removed the <video>, videojs throws 'The element or ID supplied is not valid' in an uncaught timer, and the init() promise never resolves.

**Evidence.**

```ts
setTimeout(() => {
        this._player = videojs(
          this._videoElementId,
...
  protected doDestroy(): void {
    ...
    $(`#${this._videoElementId}`).remove();
  }
...
    return new Promise<number>(resolve => {
      this._player!.one('seeked', () => {
```

**Fix.** In doInit, store the timeout handle as `this._initTimer` and keep the init resolve/reject functions. In doDestroy: - call clearTimeout(this._initTimer) - set a `_destroyed` flag, and have the timer body check it and return early - reject the pending init promise (or resolve it, if teardown should be silent)  In seek(), keep the pending resolver and settle it in doDestroy with the current position. Alternatively, also register `player.one('dispose', ...)` so the seek promise settles when the player is disposed.

Original suggestion: Store the timeout id and clear it in doDestroy, and guard the timer body with an `_isDestroyed` flag. Resolve or reject pending seek and init promises in doDestroy, for example by tracking resolvers or listening for 'dispose'.

**Verifier.** I traced this through the real code and it holds, but it only happens on a lifecycle race, so it stays low.  src/timelineproviders/position-sources/video-position-source.ts:106-149: doInit appends the <video> element, then calls videojs() inside setTimeout(..., 0). The timeout id is not stored anywhere. The init promise resolves only from player.one('canplay').  BasePositionSource.init (base-position-source.ts:93-95) just awaits doInit. BasePositionSource.destroy (base-position-source.ts:97-104) is synchronous, has no guards, and calls doDestroy. doDestroy (video-position-source.ts:152-167) does nothing about the pending timer. `_player` is still null at that point, so it only runs `$('#id').remove()`.  Failure sequence with the public, exported class (timelineproviders/index.ts:34): 1. `const p = source.init(); source.destroy();` 2. The element is removed. 3. The macrotask fires and calls videojs(missingId). video.js throws "The element or ID supplied is not valid" inside an uncaught timer callback. 4. `p` never settles.  The engine path can hit the same race. EligiusEngine.destroy (eligius-engine.ts:447-467) awaits only microtask-based cleanup before destroying every position source, so a destroy() issued while engine.init() is still pending can run before the timer fires.  seek() (lines 190-204) depends only on player.one('seeked'). video.js dispose() removes all listeners, so a destroy during an in-flight seek leaves the promise pending forever, and so does engine.seek, which awaits it (eligius-engine.ts:224/298).  There is no guard elsewhere. The tests in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts (lines 675-700) always await init before calling destroy, so they never cover this ordering.  Why this is not a duplicate: the confirmed "VideoPositionSource init never settles on load error or blocked preload" is about the missing error and reject path while the player is alive. This report is about destroy not cancelling pending work (the untracked timer and unsettled seek/init promises). That is a different defect.  Severity is low because it needs destroy or switch-away while init or seek is still in flight. A valid configuration followed by normal awaited calls never triggers it.

**Repro test.** `given VideoPositionSource whose init() was called but not awaited, when destroy() is called synchronously and timers run, then videojs is not called with the removed element id and the init promise settles`

## Uncertain (needs a human look)

None.


## Improvements

### controllers

- [label-controller.ts:75](src/controllers/label-controller.ts#L75) **LabelController inserts translations as raw HTML** (medium). Translation text goes through jQuery .html(), so any markup in locale files, including externally loaded ILocaleReference files, runs as HTML or script. The design rules require sanitising user-provided content before inserting it into the DOM. Fix: Default to .text(), add an opt-in `allowHtml` flag, or pass the text through a sanitiser. Document the behaviour.
- [navigation-controller.ts:30](src/controllers/navigation-controller.ts#L30) **Controllers take untyped TOperationData in init and expose `any` navigation** (low). NavigationController, RoutingController and ProgressbarController declare init(operationData: TOperationData) instead of their own operation-data interface. Navigation and routing data are `any` throughout, and Navigation and Routing duplicate _buildNavigationData and _getQueryVariable verbatim. RoutingController is marked 'work in progress, do not use' but is exported publicly. Fix: Type init with the declared I*OperationData interfaces and define an INavigationItem type. Extract the shared navigation-data builder and hash parser into a helper. Mark RoutingController @experimental or @deprecated in TypeDoc.
- [routing-controller.ts:38](src/controllers/routing-controller.ts#L38) **RoutingController installs popstate by assignment and has duplicate pushState branches** (low). window.onpopstate assignment clobbers other handlers and does not go through BaseController cleanup. In _pushState the first and third branches are identical pushState calls. Fix: Use addEventListener('popstate') and push the remover into this.eventListeners. Collapse _pushState to `if (currentState?.navigationId === id) replaceState else pushState`.
- [mutation-observer-controller.ts:159](src/controllers/mutation-observer-controller.ts#L159) **MutationObserverController gives no clear error for invalid option sets** (low). Some option combinations make MutationObserver.observe throw a generic TypeError from inside the addControllerToElement operation: all of observeAttributes, observeChildList and observeCharacterData false, or attributeOldValue/attributeFilter with observeAttributes:false, or characterDataOldValue with observeCharacterData:false. The message does not name the controller or option. Calling attach twice also leaks the first observer. Fix: Validate in _buildObserverOptions and throw `MutationObserverController: ...` with the offending option names. Disconnect any existing observer at the start of attach.
- [lottie-controller.ts:59](src/controllers/lottie-controller.ts#L59) **LottieController hardcodes 'nl-NL' and keeps dead IE/Edge detection** (low). The default currentLanguage is hardcoded to 'nl-NL' with a different fallback 'en-US' in attach. The _isIE/StyleMedia sniffing and the iefallback data path target browsers that are no longer supported. The renderer property is typed as renderer config but passed as rendererSettings, and no renderer type is ever passed to lottie. Fix: Initialise the language from request-current-language only. Deprecate iefallback and _isIE. Split the config into `renderer: 'svg'|'canvas'|'html'` and `rendererSettings`.

### operations-a

- [compare-date.ts:18](src/operation/compare-date.ts#L18) **@output properties declared as required in input data interfaces** (low). Several operations declare their outputs as non-optional members of the input interface. TypeScript callers must then supply results they are asking for, and the input type misdescribes runtime behaviour. Other operations in this slice (calc, getFormData, getTextContent) use `?` correctly. Fix: Make @output members optional in the input interface. Express the guaranteed outputs in the return type with RequireKeys<..., 'output'>, as getImport and createElement already do.
- [filter-array.ts:6](src/operation/filter-array.ts#L6) **Contradictory @required + @dependency tags on the same property** (low). @dependency means a previous operation supplies the value, while @required means configuration must provide it. Several properties carry both, so the metadata and schema generators get an ambiguous signal. Fix: Drop @required on dependency properties and enforce presence at runtime, as the operations already do. Have opers-metadata reject the combination.
- [custom-function.ts:35](src/operation/custom-function.ts#L35) **customFunction/getImport silently continue when the system name is not registered** (medium). A misspelled systemName makes customFunction return the data unchanged and makes getImport set importedInstance to undefined, with no message. This goes against the fail-fast and name-the-operation error rule, and the resulting bugs show up far from their cause. Fix: Throw `customFunction: no function registered for systemName '${systemName}'`, and the equivalent in getImport, or at least console.warn as getControllerFromElement does.
- [calc.ts:62](src/operation/calc.ts#L62) **calc gives unhelpful errors for unknown operators and non-numeric operands** (low). An unknown operator throws 'calcFunctions[operator] is not a function', and an operand that is not a number (for example an unresolved property chain string) silently produces NaN, which then flows into later operations. Fix: Validate that the operator is in calcFunctions and that both operands are finite after conversion. Throw `calc: ...` messages that include the offending values.
- [for-each.ts:35](src/operation/for-each.ts#L35) **forEach leaves `collection` on operation data after the loop** (low). collection is not erased, so a possibly large array keeps flowing through every operation after the loop and ends up in the action's resolved data. Erasing it naively would break the per-iteration re-entry, because the config is re-merged on each pass, so the cleanup belongs on the final endForEach. Fix: Have endForEach (on loop exit) and breakForEach delete operationData.collection, and tag it @erased.
- [filter-array.ts:93](src/operation/filter-array.ts#L93) **filterArray and findInArray treat primitive arrays differently in property mode** (low). findInArray compares primitive items with `item === findValue`, while filterArray always returns false for primitives. The two sibling operations give different answers for the same arguments. Neither can match a value of `undefined`. Fix: Align the two (pick one semantic and document it) and share a single matcher helper.
- [announce-to-screen-reader.ts:48](src/operation/announce-to-screen-reader.ts#L48) **announceToScreenReader drops repeated identical messages; related doc gaps** (low). Setting textContent to the same string again is generally not announced by screen readers, so a repeated announcement (for example the same step message twice) is lost. Changing aria-live on an existing region is also unreliable. Related doc mismatches in this slice: getFormData claims hidden fields are excluded, but serializeArray includes type=hidden inputs; formatDate claims to use Intl.DateTimeFormat but does not, and replaces only the first occurrence of each token. Fix: Clear textContent and set it again on the next frame (or toggle a zero-width character), keeping separate polite and assertive regions. Correct the getFormData and formatDate docs, and use replaceAll in formatDate.

### lens-security-robustness

- [configuration-resolver.ts:152](src/configuration/configuration-resolver.ts#L152) **ConfigurationResolver does not validate resolved operation instances** (medium). An unknown systemName, or a name that resolves to a controller class, is accepted silently as instance: undefined or a class. The failure comes later, at action execution, as 'Cannot read properties of undefined (reading call)' or 'Class constructor cannot be invoked without new', with no operation name or JSON path. That violates the fail-fast rule for configuration errors. Fix: After import, check typeof instance === 'function' and that the name is in importer.getOperationNames(). Otherwise throw an error naming the JSON path (e.g. timelines[0].timelineActions[2].startOperations[1].systemName) and the unknown name. Do the same for unresolvable 'config:' placeholders.
- [math.ts:29](src/operation/math.ts#L29) **Lookup-by-name operations throw bare TypeErrors for unknown operators/functions** (low). math (functionName), calc (operator) and when (operator, or no operator) index tables directly with configuration strings. Unknown values throw generic TypeErrors that do not name the operation or the bad value. The http-* operations prefix their errors twice ('httpPost: httpPost: HTTP error 404') because they rethrow inside their own catch. Fix: Check with Object.hasOwn(calcFunctions, operator) and typeof Math[functionName] === 'function', and throw `math: unknown functionName "x"`. In the http-* operations, rethrow errors that already carry the prefix without wrapping them again.

### operations-b

- [when.ts:82](src/operation/when.ts#L82) **when gives an opaque TypeError for malformed or spaced expressions** (low). An expression with no operator leaves `right` undefined, and `right.length` throws a generic TypeError. Surrounding whitespace ('a == b') becomes part of the property name, giving a confusing 'cannot be resolved' error. Neither error names the expression, which goes against 'Operations throw with the operation name and relevant data'. Fix: Validate the split result and throw `when: invalid expression '${expression}'`. Trim both operands.
- [math.ts:47](src/operation/math.ts#L47) **math and invokeObjectMethod lack input validation and named errors** (low). An unknown functionName produces 'Cannot read properties of undefined (reading apply)', with no operation name in the message. invokeObjectMethod throws a raw TypeError when instance is undefined, and when the member is not a function it only logs and continues, which hides configuration errors. Fix: Check typeof Math[functionName] === 'function' and throw `math: unknown function '${functionName}'`. In invokeObjectMethod, throw on a missing instance or a non-function member.
- [remove-properties-from-operation-data.ts:23](src/operation/remove-properties-from-operation-data.ts#L23) **removePropertiesFromOperationData mutates its propertyNames input array** (low). The operation pushes 'propertyNames' into the caller-supplied array. That is a hidden side effect on input data. Right now it only works safely because Action deep-copies operation data first. Fix: Use const names = new Set([...propertyNames, 'propertyNames']) and filter against it.

### eventbus-locale-util

- [eventbus.ts:220](src/eventbus/eventbus.ts#L220) **Handler exceptions in Eventbus abort dispatch and propagate into the broadcaster** (medium). Unlike TypedEventEmitter, Eventbus does not isolate handler errors. One throwing controller handler stops every later handler and throws into the caller, which can be engine or adapter code broadcasting timeline-time on every tick. That is engine state corruption, which CLAUDE.md forbids. Fix: Wrap each handler call (and each listener call) in try/catch, logging the event name and topic, the same way TypedEventEmitter.emit does.
- [locale-loader.ts:141](src/locale/locale-loader.ts#L141) **LocaleLoader fetch has no timeout/abort; a stalled server hangs init forever** (low). _doFetch awaits fetch with no AbortSignal or timeout. A stalled request also stays in _loading, so every concurrent and later load of the same URL waits on it indefinitely. Fix: Add an optional timeoutMs to ILocaleLoaderOptions and pass AbortSignal.timeout(timeoutMs) to fetch. Include the URL in the timeout error.
- [typed-event-emitter.ts:220](src/util/typed-event-emitter.ts#L220) **TypedEventEmitter.off(handler) cannot remove a once() registration** (low). once() registers an internal wrapper, so off(event, originalHandler) silently does nothing. The ITypedEventEmitter.off contract does not mention this. Eventbus.once has the same limitation. Fix: Keep a WeakMap from original handler to wrapper, and have off() look up and remove the wrapper. Or document that only the returned unsubscribe function works.
- [eligius-resource-importer.ts:32](src/importer/eligius-resource-importer.ts#L32) **EligiusResourceImporter.import returns {name: undefined} for unknown names** (low). An unknown or misspelled systemName produces an object whose value is undefined. ConfigurationResolver stores that as the operation instance without checking, so the failure surfaces later as 'instance.call is not a function', far from the configuration path. CLAUDE.md requires fail-fast configuration errors. Fix: Throw `Unknown system name '${name}'` (listing near matches if possible) when value is undefined, or have ConfigurationResolver validate and report the JSON path.
- [locale-manager.ts:107](src/locale/locale-manager.ts#L107) **t() can return non-strings (objects) despite string return type** (low). rosetta.t returns the raw value for non-string, non-function values. A key that points at a namespace object returns that object, typed as string, and LabelController would render it as '[object Object]'. Fix: Return typeof result === 'string' ? result : '' and treat the non-string case as a missing key (with a debug warning).
- [prepare-value-for-serialization.ts:12](src/util/prepare-value-for-serialization.ts#L12) **prepareValueForSerialization is dead code and crashes on null-prototype objects** (low). It is not referenced anywhere outside its spec and not exported. It also dereferences value.constructor, which is undefined for Object.create(null), and recurses without cycle detection. Fix: Delete it with its spec. If it is kept, guard constructor with optional chaining and track seen objects.

### timeline-providers-adapters

- [base-position-source.ts:97](src/timelineproviders/position-sources/base-position-source.ts#L97) **BasePositionSource has no destroyed guard and no listener removal** (medium). destroy() does not mark the instance destroyed, does not clear callback arrays, and allows a later activate(). onPosition, onBoundaryReached and onActivated return void, so callers cannot unsubscribe. EligiusEngine.switchTimeline destroys a source that stays in timelineProviders and may re-activate it later. For VideoPositionSource that silently sets the state to 'active' with _player=null. Fix: Add a `_destroyed` flag; make activate(), seek() and init() throw a named error after destroy, clear the callback arrays in destroy, and have on* return an unsubscribe function (an additive API change).
- [keyboard-step-source.ts:249](src/timelineproviders/position-sources/keyboard-step-source.ts#L249) **KeyboardStepSource takes over the global hotkeys scope and silently falls back to global** (low). _bindKeys calls hotkeys.setScope(this._scopeId), which changes the process-wide hotkeys-js scope and disables the consumer's own scoped hotkeys while the source is active. In addition, a targetElement selector that matches nothing quietly falls back to document-wide bindings. Fix: Restore the previous scope (hotkeys.getScope()) on unbind, or bind without changing the global scope. Reject init with an error naming the selector when targetElement does not resolve.
- [video-position-source.ts:432](src/timelineproviders/position-sources/video-position-source.ts#L432) **VideoPositionSource deactivate pauses twice and ignores initial loop** (low). The overridden deactivate calls stopTicking() and then super.deactivate(), which calls stopTicking() again because the state is still 'active'. doInit also passes the `loop: this.loop` snapshot into video.js options, so a later loop change does not reach the native element. If the user options set loop:true, 'ended' never fires and no boundary is emitted. Fix: Drop the explicit stopTicking in the override. Force `loop: false` on the native player (the source implements looping itself) after spreading options.

### lens-performance

- [eligius-engine.ts:798](src/eligius-engine.ts#L798) **Fire-and-forget action dispatch: no end-before-start guarantee, unhandled rejections** (medium). sortActionsPerPosition carefully puts end methods before start methods, but _executeActionsForPosition calls all of them synchronously and drops the promises. Any async end operation (animate, animateWithClass, wait) overlaps the next action's start. A failing action's rejected promise (Action.start rethrows) is never handled. Fix: Chain each key's executions (end methods awaited before start methods, or all ends via Promise.all and then starts) without blocking the tick. Attach a terminal .catch that emits an engine 'error' event instead of leaving the rejection unhandled.

### configuration-tools

- [action-creator-factory.ts:12](src/configuration/api/action-creator-factory.ts#L12) **ConfigurationFactory cannot load in Node: it imports operations (jQuery)** (medium). The fluent API checks names with `import * as operations from '@operation/index.ts'`, which loads jquery at module evaluation. Importing ConfigurationFactory in plain Node throws 'jQuery requires a window with a document', yet the class docs show using it with fs.writeFileSync. action-editor.ts and name-providers.ts do the same. Fix: Validate names against the DOM-free metadata entry (@operation/metadata/index.ts, already used by OperationMetadataProvider) instead of the implementation barrel. For *ByType methods, accept a name or move them to a browser-only module.
- [generate-schemas.ts:206](src/tools/schema-tools/generate-schemas.ts#L206) **Operation schema requires UUID ids but the types and resolver accept any string** (medium). Every operation schema adds a UUID regex pattern to `id`. IOperationConfiguration.id is a plain string, and the resolver/tests use ids like 'test', so hand-written configs that run fine are rejected by the schema. Fix: Drop the pattern, or add it to the TS type as a documented constraint (with a @pattern tag) and enforce it consistently for all ids.
- [configuration-resolver.ts:50](src/configuration/configuration-resolver.ts#L50) **Configuration errors do not name the JSON path** (medium). The resolver's only explicit error is generic. Placeholder failures surface from getPropertyChainValue as "Property chain 'x.y' cannot be resolved" with no config path, and unknown template:/json: keys silently resolve to undefined. CLAUDE.md requires errors that pinpoint the JSON path and suggest a fix. Fix: Thread a path accumulator through resolvePlaceholders/resolve* and wrap failures as `${path}: ${reason}`. Throw when template:/json: keys resolve to undefined.
- [ctrls-metadata-generator.ts:324](src/tools/code-generator/ctrls-metadata-generator.ts#L324) **Operation and controller metadata generators duplicate ~350 lines** (low). toPathAlias, toImport, toOperationDataType, getTypeFromProperty, getTag and the property filters are copy-pasted between the two generators and have already drifted. The controller toProp ignores @erased, its toImport lacks the alias-symbol fallback, and its index export names are derived from file names with a hardcoded `dom-` special case. Fix: Extract a shared module in src/tools/code-generator/, and derive index export names from the generated function name (the class name) rather than the file name.
- [generate-event-interfaces.ts:405](src/tools/code-generator/generate-event-interfaces.ts#L405) **Dead or dangerous tool scripts remain in src/tools** (low). generate-event-interfaces.ts is not wired into package.json. If run, it overwrites 34 hand-written event files with placeholder docs ('Event: x') and stale arg types (for example label-collection events that were removed in 2.2.0), and its replace is a no-op. uvu2vitest-codemod.ts is a completed migration still exposed as `npm run codemod`. schema-tools/html-tag-names.ts is not referenced anywhere. Fix: Delete generate-event-interfaces.ts, html-tag-names.ts and the codemod, together with the `codemod` script.
- [name-providers.ts:13](src/configuration/api/name-providers.ts#L13) **Name providers' return types misstate string[] as a single name** (low). getOperationNames/getControllerNames return string arrays but are typed as a single TOperationName/TControllerName through a double cast, so consumers get wrong types. OperationEditor.getOperationDataKeys has the same problem (line 537 of action-editor.ts). Fix: Return TOperationName[] / TControllerName[] and (keyof ...)[] respectively. This is a public type change, so release it as minor/major as appropriate.
- [action-editor.ts:225](src/configuration/api/action-editor.ts#L225) **moveStartOperation/moveEndOperation: 'up' increments index and wraps around** (low). 'up' moves the operation to a later position (idx + 1), the opposite of the usual list-editor meaning, and array_move wraps the last item to index 0 instead of no-oping. The tests encode this behaviour, so changing it is an API decision, but neither the naming nor the wrap is documented. Fix: Document the semantics in TypeDoc, or rename to 'later'/'earlier' and clamp at the bounds.
- [configuration-factory.ts:548](src/configuration/api/configuration-factory.ts#L548) **editTimelineAction error message names the id instead of the uri** (low). When the timeline is missing, the error reports the action id as if it were the timeline id, which misleads debugging. Fix: throw new Error(`Timeline not found for uri '${uri}'`);

### engine-core

- [eligius-engine.ts:756](src/eligius-engine.ts#L756) **Remove the engine's dead legacy callback-style request handlers** (medium). request-engine-root, request-current-timeline-position, timeline-container-request, timeline-duration-request and timeline-request-current-timeline are registered with eventbus.on and expect a result callback. Every caller in src uses eventbus.request(), which only reaches onRequest responders (the adapter). These handlers are dead code. The position one is also wrong at 0: `getPosition() || -1` returns -1 at position 0. Fix: Delete these handlers along with the duplicate command listeners, and remove the identity-`floor` parameters that are left over from removing Math.floor.
- [eligius-engine.ts:237](src/eligius-engine.ts#L237) **seek() has a no-op 'resume' block and two isSeekable guards** (low). seek() calls activate() only when the state is already 'active', and BasePositionSource.activate returns early in that state, so the block never does anything. Its comment ('Resume if was active before seek') implies the pre-seek state was captured, which it was not. The file also redefines isSeekable, which already exists in timelineproviders/types.ts. Fix: Capture `const wasActive = state === 'active'` before seeking and handle suspend/resume explicitly, or delete the block. Import isSeekable from '@timelineproviders/types.ts'.
- [eligius-engine.ts:659](src/eligius-engine.ts#L659) **End-order sort key is only set for actions with an id** (low). startPosition, the key used to end nested actions in reverse start order at a shared end position, is assigned only inside the `id?.length` branch. The comparator returns 0 when either key is undefined, which also makes it non-transitive for mixed sets. Fix: Always set endMethod.startPosition = timeLineAction.duration.start. Separately, avoid mutating the resolved config's duration.end (line 648).
- [eligius-flow-controller.ts:7](src/eligius-flow-controller.ts#L7) **EligiusFlowController is unused dead code** (low). The class only stores configuration.timelineFlow and ignores its eventbus argument. Nothing in src imports it, it is not exported from index.ts, and it has no tests. timelineFlow configuration therefore does nothing. Fix: Delete the file, or document timelineFlow as unimplemented in the schema and docs until it is wired up.

### lens-lifecycle-memory

- [eligius-engine.ts:465](src/eligius-engine.ts#L465) **Engine destroy never detaches controllers left on elements** (medium). Controllers are only detached by an explicit removeControllerFromElement end operation. destroy() calls container.empty(), which drops jQuery data (the controller list) without calling detach(). The controllers' eventbus listeners stay on the factory's long-lived eventbus. A missing end operation in the configuration therefore becomes a permanent leak across engine recreations. Fix: Before empty(), walk `container.find('*').addBack()`, read getElementControllers(el) for each element, and call ctrl.detach(eventbus) on each controller. Alternatively, keep an engine-level registry of attached controllers and detach them all on destroy.
- [base-position-source.ts:166](src/timelineproviders/position-sources/base-position-source.ts#L166) **Position source callback registration has no unsubscribe and survives destroy()** (low). onPosition, onBoundaryReached and onActivated return void, and destroy() never clears the callback arrays. Calling engine.init() a second time on the same source registers duplicate callbacks, so every tick runs actions twice. The arrays also keep the engine closure alive after destroy. Callers cannot release their own subscriptions. Fix: Return a remover function from each on* method (a non-breaking widening of void). Clear the three callback arrays in destroy(), and have the engine store and call the removers.
- [eligius-engine.ts:285](src/eligius-engine.ts#L285) **switchTimeline's eventbus.once handler and _eventbusRemovers are not tracked or reset** (low). The once('timeline-firstframe') remover is discarded, so a destroy before the first frame leaves the closure on the shared eventbus. If a later engine created on the same eventbus broadcasts firstframe, the handler runs against the destroyed engine. destroy() also calls each remover but never empties _eventbusRemovers. Fix: Push the once() remover into _eventbusRemovers, and set `this._eventbusRemovers = []` after calling them in destroy().

## Optimisations

- [subtitles-controller.ts:63](src/controllers/subtitles-controller.ts#L63) **SubtitlesController seek lookup is a linear scan per seek** (low, controllers). Once onTimeHandler is fixed to use a range lookup (see the subtitle bug above), a linear find over all titles runs every timeline-time tick, which fires per RAF or video timeupdate. That is O(n) per tick for long subtitle tracks. onSeekedHandler already scans linearly on every seek. Fix: Sort durations in init and keep a cursor index that moves forward during playback (O(1) amortised per tick). Use binary search on seek.
- [eventbus.ts:69](src/eventbus/eventbus.ts#L69) **Eventbus lookups allocate permanent empty arrays for every name/topic touched** (low, eventbus-locale-util). _getEventHandlers and _getEventInterceptors run on every broadcast and off(), and insert an empty array for keys that have no subscribers. With broadcastForTopic on dynamic topics (per-element or per-timeline topics), the maps grow without bound over a long session. Per-broadcast cost also includes two map writes and closures on the per-tick timeline-time path. Fix: Use a read-only lookup (this.eventHandlers.get(key) ?? EMPTY) in broadcast and off, and create entries only in on and registerInterceptor. Delete map keys when an array becomes empty.
- [action.ts:90](src/action/action.ts#L90) **Per-execution structuredClone of operationData is quadratic inside forEach loops** (high, lens-performance). Every operation execution deep-copies its static operationData with structuredClone, including `{}` for operations with no data. Inside a loop the forEach operation re-executes each iteration and re-clones its whole literal collection, so a loop of n items costs O(n^2) element copies. Measured: 1000 items took 143ms and 3000 items took 827ms for a trivial body, roughly n^2. Fix: At resolve time, precompute per operation whether operationData has nested objects or arrays. Skip cloning when it is empty, and use a shallow spread when it holds only primitives. For forEach, do not re-copy its operationData on re-entry (scope.owner === operationInfo), or let forEach read the collection without the merged copy.
- [select-element.ts:70](src/operation/select-element.ts#L70) **selectElement re-queries the engine root through the eventbus on every call** (low, lens-performance). Every selectElement execution does an eventbus request whose responder runs `$(containerSelector)`, a full document query, before root.find(selector). The root never changes after init, so this doubles the DOM queries per action start. Fix: Resolve $(containerSelector) once in _createLayoutTemplate and return the cached jQuery object from the request-engine-root handler and the engineRoot getter.
- [eligius-engine.ts:787](src/eligius-engine.ts#L787) **Duplicate per-tick 'timeline-time' broadcast doubles listener work every tick** (medium, lens-lifecycle-memory). Hot path: each position change (each RAF tick, scroll event or video timeupdate) broadcasts 'timeline-time' directly and again through EngineEventbusAdapter. Each broadcast runs the interceptors, every IEventbusListener (ActionRegistryEventbusListener builds operationData and starts matching actions), and every handler, so the per-tick eventbus cost is doubled. Fixing the duplicate-wiring bug removes this. Fix: Drop the direct broadcast and let the adapter forward the emitter event.

## Test gaps

### controllers

- src/test/unit/controllers/LottieController.spec.ts: loadAnimation call count per attach (the double creation is untested)
- src/test/unit/controllers/LottieController.spec.ts: detach without [freeze,end] in the URL (the test forces endPosition=-1 and hides the bug)
- src/test/unit/controllers/LottieController.spec.ts: _createTextDataLookup with labelData not pre-seeded, and assertion of the replaced !!label!! text in animationData
- src/test/unit/controllers/LottieController.spec.ts: re-attach before the deferred 'complete' destroy fires
- src/test/unit/controllers/SubtitlesController.spec.ts: timeline-time with fractional positions (video source)
- src/test/unit/controllers/SubtitlesController.spec.ts: language-change to a language missing from subtitleData
- src/test/unit/controllers/SubtitlesController.spec.ts: detach clears the displayed subtitle
- src/test/unit/controllers/NavigationController.spec.ts: initial highlight / activeNavigationPoint from the URL hash on attach
- src/test/unit/controllers/NavigationController.spec.ts: menu mouseup broadcasts request-video-url exactly once
- src/test/unit/controllers/NavigationController.spec.ts: video-complete for the last item or an unknown index
- src/test/unit/controllers/NavigationController.spec.ts: detach removes the generated menu DOM and does not touch window.onpopstate
- src/test/unit/controllers/RoutingController.spec.ts: attach with an unknown navigation id in the hash, and a hash without a position segment
- src/test/unit/controllers/DOMEventListenerController.spec.ts: detach only removes its own handler; detach then attach re-registers
- src/test/unit/controllers/ProgressbarController.spec.ts: duration 0, timeline-duration change after attach, and a click on a child element
- src/test/unit/controllers/mutation-observer-controller.spec.ts: invalid option combinations, and attach twice

### operations-a

- src/test/integration/for-each-loop.spec.ts: breakForEach or continueForEach placed inside a when/endWhen block within a forEach
- src/test/unit/operation/custom-function.spec.ts: a synchronous custom function that returns operationData (non-promise); an unregistered systemName; the returned data being merged
- src/test/unit/operation/create-element.spec.ts: escaping of text and attribute values containing markup or quotes; falsy attribute values (0, '')
- src/test/unit/operation/animate-with-class.spec.ts: removeClass/className not leaking to the next operation; a bubbled child animationend; a class without an animation
- src/test/unit/operation/clear-storage.spec.ts: an empty or whitespace key (currently clears all storage)
- src/test/unit/operation/end-action.spec.ts: actionOperationData keys that collide with existing operation data keys; a rejected end() promise
- src/test/unit/operation/filter-array.spec.ts and find-in-array.spec.ts: a predicate supplied through an Action's configured operationData (DataCloneError path); primitive arrays in property mode
- src/test/unit/operation/compare-date.spec.ts and format-date.spec.ts: epoch timestamp 0; repeated format tokens
- src/test/unit/operation/format-text.spec.ts: titlecase with apostrophes and non-ASCII letters
- src/test/unit/operation/extend-controller.spec.ts: an extension containing a __proto__ key

### lens-security-robustness

- src/operation/helper/get-property-chain-value.ts: rejection of __proto__/constructor/prototype segments
- src/operation/set-data.ts: prototype pollution via '$operationdata.__proto__.x' target key
- src/operation/invoke-object-method.ts: refusing Function/constructor/call invocation chains
- src/operation/helper/resolve-property-values.ts: nested object and array resolution when newProperties !== operationData (only flat and in-place cases tested)
- src/operation/when.ts: quoted string literal operands, whitespace around operators, expression without an operator
- src/operation/create-element.ts: attribute values containing quotes, falsy attribute values (0, ''), HTML in text
- src/controllers/routing-controller.ts: unknown or crafted hash navigation id on attach and popstate
- src/controllers/dom-event-listener-controller.ts: detach followed by attach, and two controllers sharing the same event on one element
- src/operation/add-globals-to-operation.ts: globals holding jQuery or function values
- src/operation/load-json.ts: non-OK HTTP response and mutation of a cached result
- src/configuration/configuration-resolver.ts: unknown operation systemName fails at resolve time

### operations-b

- src/test/unit/operation/helper/resolve-property-values.spec.ts: nested objects and arrays containing $operationdata chains, and that the input is not mutated
- src/test/unit/operation/set-data.spec.ts: rejection of __proto__/constructor/prototype path segments
- src/test/unit/operation/helper/get-property-chain-value.spec.ts: blocking of inherited constructor/__proto__ access; falsy intermediate values ('' / 0)
- src/test/unit/operation/when.spec.ts: quoted string literal operands; nested when without otherwise inside an outer when with otherwise (newIndex); malformed expression without operator
- src/test/unit/operation/start-action.spec.ts: missing actionOperationData; overlapping keys between operationData and actionOperationData; undefined actionInstance; action start rejection
- src/test/unit/operation/reparent-element.spec.ts: jQuery data/controllers and event handlers survive reparenting
- src/test/unit/operation/http-put.spec.ts / http-post.spec.ts: 204 No Content success; exact error message (no double prefix); network failure from fetch rejecting
- src/test/unit/operation/load-json.spec.ts: non-ok HTTP status; falsy cached JSON values
- src/test/unit/operation/replace-text.spec.ts: non-global regex with capture groups count
- src/test/unit/operation/load-from-storage.spec.ts / save-to-storage.spec.ts: key erased from output; storage access throwing (SecurityError)
- src/test/unit/operation/helper/globals.spec.ts: getGlobals(name) with function values; clearing globals on engine destroy
- src/test/unit/operation/map-array.spec.ts / sort-array.spec.ts: function parameters executed through an Action (deepCopy path) rather than called directly

### eventbus-locale-util

- src/test/unit/eventbus/eventbus.spec.ts: once() combined with on() for the same event in one broadcast (second handler skipped)
- src/test/unit/eventbus/eventbus.spec.ts: off()/remover called from inside a handler during broadcast
- src/test/unit/eventbus/eventbus.spec.ts: once() handler that rebroadcasts the same event, or throws
- src/test/unit/eventbus/eventbus.spec.ts: handler exception isolation, and order of multiple interceptors
- src/test/unit/eventbus/eventbus.spec.ts: clear() removing on/once handlers, interceptors and listeners (only responders are tested)
- src/test/unit/eventbus: no spec exists for ActionRegistryEventbusListener (topic keys, multiple actions per event, operationData isolation)
- src/test/unit/eventbus: no spec exists for RequestVideoUriInterceptor
- src/test/unit/locale/locale-manager.spec.ts: setLocale to the same locale (no emit) and to an unavailable locale (fallback)
- src/test/unit/locale/locale-manager.spec.ts: t() with locale override when the translation function throws (locale restored)
- src/test/unit/locale/locale-manager.spec.ts: loadLocale twice with overlapping nested namespaces (merge semantics)
- src/test/unit/locale/locale-manager.spec.ts: change handler that throws or unsubscribes during emit
- src/test/unit/locale/locale-loader.spec.ts: diamond/duplicate $ref within a single tree (false circular detection)
- src/test/unit/locale/locale-loader.spec.ts: default globalThis fetch path (no fetch option); only injected fetch is tested
- src/test/unit/locale/locale-loader.spec.ts: non-ok HTTP response and invalid JSON body; failed fetch not cached and retried
- src/test/unit/locale/locale-loader.spec.ts: relative nested $ref resolution against a parent URL
- src/test/integration: language-change broadcast through real LocaleEventbusAdapter + LocaleManager (stack overflow is undetected because the adapter spec mocks broadcast)
- src/test/integration: configuration locales with {$ref} entries through EngineFactory
- src/test/unit/util: no spec for animationInterval (abort stops callbacks, no callback after abort)
- src/test/unit/util: no specs for guards is-promise / is-object / is-function / is-string (e.g. isPromise(null), isObject on arrays/Date)
- src/test/unit/importer/eligius-resource-importer.spec.ts: import() with an unknown name, and import of eventbus/engine entries

### timeline-providers-adapters

- src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts: no test uses the real animationInterval/RAF timestamp; animationInterval is always mocked to pass elapsed ms
- src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts: no tick is simulated after resume-from-suspend or after seek while active, so the anchor loss is untested
- src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts: order of 'end' boundary vs final setPosition(duration) is not asserted
- src/test/unit/adapters/locale-eventbus-adapter.spec.ts: no test with the real Eventbus + LocaleManager; the language-change recursion is invisible behind mocks
- src/test/unit/adapters/engine-eventbus-adapter.spec.ts: uses a mocked engine; double handling with EligiusEngine's own listeners (toggle, seek, request-timeline-uri) and double broadcasts are untested
- src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts: no test for init rejection on player 'error' or a missing container
- src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts: no test for play() promise rejection (autoplay blocked)
- src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts: 'firstplay' is triggered manually by the mock; real video.js 8 event names are not verified
- src/test/unit/timelineproviders/position-sources/keyboard-step-source.spec.ts: chapter navigation with position before the first marker
- src/test/unit/timelineproviders/position-sources/scroll-position-source.spec.ts: activation with a pre-existing scroll offset, seek while suspended, fractional scrollTop at bottom
- src/test/unit/timelineproviders/container-providers/dom-container-provider.spec.ts: nothing verifies that the engine/factory ever calls init(), so getContainer() is undefined in real use
- src/test/unit/timelineproviders/position-sources/base-position-source.spec.ts: behaviour of activate()/seek() after destroy()

### lens-performance

- src/util/animation-interval.ts: has no test at all; nothing checks that the callback receives elapsed rather than absolute time, or what happens with abort, drift or skipped frames
- src/timelineproviders/position-sources/raf-position-source.ts: tests mock animationInterval with elapsed-ms values, so the absolute-timestamp bug is hidden; no test ticks after seek() or after resume to check the position continues from the seek or paused position
- src/eligius-engine.ts: no test for switchTimeline between different timeline types (the engine-decomposed spec only asserts that two mocks are different objects)
- src/eligius-engine.ts: no test for skipped position keys (e.g. 4 -> 6) or non-quantised float positions from video, scroll or keyboard sources; the spec instead asserts that 5.2 -> 5.4 skips a 5.3 action
- src/eligius-engine.ts: no test for seek while playing on an action without endOperations (double start)
- src/eligius-engine.ts: no test that the timeline-duration payload can be called
- src/eligius-engine.ts: no test that request-current-timeline-position returns 0 at position 0
- src/action/action.ts: no test for large forEach collections (stack depth, quadratic deepCopy cost)
- src/operation/helper/resolve-property-values.ts: no test for nested-object or array properties when newProperties !== operationData
- src/operation/animate.ts: no test for an empty selection or a multi-element selection
- src/operation/animate-with-class.ts: no test for the never-firing animationend (no animation on the class)

### configuration-tools

- src/test/unit/configuration/api/action-editor.spec.ts: no test that an edit via ConfigurationFactory.editAction/editInitAction/editTimelineAction appears in factory.getConfiguration() (all editor tests use a stub `{}` factory)
- src/test/unit/configuration/api/configuration-factory.spec.ts: no round-trip test that a config built with the fluent API is accepted by ConfigurationResolver.process
- src/test/unit/configuration/api/configuration-factory.spec.ts: editTimelineProviderSettings on a configuration without timelineProviderSettings
- src/configuration/api/action-creator-factory.ts: ActionCreator/EndableActionCreator/TimelineActionCreator have no dedicated spec (getConfiguration replacement, addDuration, addEndOperationByType)
- src/test/unit/configuration/configuration-resolver.spec.ts: unknown operation systemName does not throw (mock importer always returns {} so instance is never undefined)
- src/test/unit/configuration/configuration-resolver.spec.ts: missing timelineProviderSettings throws
- src/test/unit/configuration/configuration-resolver.spec.ts: duplicate action names, config: placeholder ordering, and input immutability
- src/test/unit/configuration/configuration-resolver.spec.ts: eventActions present without an actionRegistryListener
- src/configuration/api/subtitle-converter.ts: SubtitleImporter has no tests (multi-line caption concatenation, frame-part timecodes)
- src/test/unit/configuration/api/name-providers.spec.ts: getOperationNames/getControllerNames and the unknown-operation metadata error are untested
- src/tools/schema-tools/generate-schemas.ts: no test that every exported operation has a schema or that @dependency props are not required
- src/tools/code-generator/metadata-generator.ts: no test of doc-tag to metadata mapping (optional props, @erased, @output, @type)
- src/tools/code-generator/events-metadata-generator.ts: no test that @private events stay in EventMap

### engine-core

- src/engine-factory.ts: no integration test counts eventbus broadcasts or handler invocations for a factory-created engine (double timeline-play, double seek, broken toggle)
- src/eligius-engine.ts: switchTimeline to a timeline of a different type, with a separate position source (callback registration, init, destroyed source reuse)
- src/engine-factory.ts: timelines of the same type with different durations; engine.duration after switchTimeline
- src/eligius-engine.ts: timeline actions driven by fractional, non-tick-aligned positions (video/scroll/keyboard style), and by backward or skipping positions
- src/eligius-engine.ts: stop() followed by start() with actions active at stop time
- src/eligius-engine.ts: looping timeline restart with actions ending at duration
- src/eligius-engine.ts: switchTimeline(uri, position>0) is resolved only by manually calling the once callback; no test that the awaited promise reflects the final position/playState or covers loop:true with position
- src/eligius-engine.ts: destroy() when an end action rejects, and destroy() while the source is active
- src/eligius-engine.ts: seek(NaN) and seek onto an exact action key while playing (double start of start-only actions)
- src/eligius-engine.ts: rejection from a timeline action started by _onTimeHandler
- src/action/action.ts: concurrent start()/end() on the same action instance with async operations and when/forEach control flow
- src/engine-factory.ts: the returned destroy() removing the ActionRegistryEventbusListener and interceptor on a shared eventbus
- src/eligius-engine.ts: init() with timelines: [] and calling init() twice
- src/eligius-flow-controller.ts: no tests at all

### lens-lifecycle-memory

- src/test/unit/engine-factory.spec.ts: createEngine().destroy() with real adapters and end operations that use selectElement. The integration test end-in-correct-order calls engine.destroy() directly instead of the factory result destroy()
- src/test/unit/engine-factory.spec.ts: interceptor and ActionRegistryEventbusListener removal after the per-engine destroy(), and createEngine called twice on one factory
- src/test/integration: timeline-play-toggle-request, request-timeline-uri and timeline-seek-request through a factory-built engine (engine handlers plus adapter handlers), counting how often start/pause/switchTimeline are called and how often timeline-time is broadcast
- src/test/unit/eligius-engine.spec.ts: switching to a different provider type only asserts that the old source was destroyed. It does not check that the new source gets init()/onPosition, or that actions run on the new timeline
- src/test/unit/adapters/engine-input-adapter.spec.ts: hotkeys is mocked, so unbinding while a non-'all' scope is active (KeyboardStepSource) is untested
- src/test/unit/eventbus/eventbus.spec.ts: a once() or self-removing handler followed by another handler on the same event (the second handler gets skipped)
- src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts: animationInterval is mocked, so the real RAF timestamp semantics, resume-after-suspend and seek persistence across ticks are untested
- src/test/unit/controllers/LottieController.spec.ts: detach without URL markers hits the immediate-destroy branch only because the test sets endPosition=-1 by hand; loop:true detach is untested
- src/test/unit/controllers/DOMEventListenerController.spec.ts: detach of one controller leaving another controller's handler for the same event intact
- src/test/unit/eligius-engine.spec.ts: destroy while playing with async end operations (the source keeps ticking during _cleanUp)
- src/test/unit/eligius-engine.spec.ts: containerProvider.init()/getContainer() being populated after engine.init()
- src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts: destroy before the init setTimeout fires, and destroy during a pending seek

## Expansion

### Proposer assessments

- **maturity-skeptic**: Skeptic's verdict: the engine has all the features it needs. The work left is finishing and fixing what is already there, not adding to it.  What it already has: - About 72 operations (src/operation/index.ts) covering DOM, data, control flow, form, text, storage, array, scroll, HTTP, focus/accessibility and date work. - 8 controllers (src/controllers/index.ts) and about 45 typed events. - 4 position sources (RAF, Video, Scroll, KeyboardStep), a container provider and a playlist. - A rosetta-based locale system, a fluent ConfigurationFactory, generated metadata and JSON schema, and a jQuery-free metadata entry.  The CHANGELOG from 1.4 to 2.2 shows the project has spent its last several releases consolidating rather than adding: the 004 decomposition, the 003 eventbus typing, the 005 locale rewrite, and the removal of devtools and LanguageManager. Recent non-dependency commits since early 2026 are all fixes or refinements: timeline-switch fix #169, $scope chain resolution #165, bracket indices #168, metadata subpath #166.  Proof that the architecture can already be extended without core changes: - Position sources, containers and playlists are resolved by `systemName` through a pluggable IResourceImporter (src/engine-factory.ts:255-321). Custom ones need no core change. - `customFunction`, `requestAction` and `broadcastEvent` cover anything the operation list lacks. - The ~20 ideas in specs/position-source-ideas.md (Mouse, Gyro, Gamepad, Geolocation, AmbientLight...) have no user story, spec or issue behind them. Each can be built outside the core by any consumer, so none should be added to the core.  The real debt is half-finished migrations and drift, all fix work: 1. LottieController still calls `eventbus.request('request-label-collections', ...)` (src/controllers/lottie-controller.ts:110-114). Nothing answers that request since 2.2.0 removed LanguageManager, so Lottie text replacement silently gets an empty array. 2. RequestLabelCollection(s)Event and the ILabel type are still exported (src/eventbus/events/index.ts:10-11, src/configuration/types.ts:12) after the 2.2.0 removal. 3. `request-translation`, which LabelController, NavigationController and LocaleEventbusAdapter all rely on, has no event file. It is missing from EventMap (src/eventbus/events/types.ts), which breaks the 003 typed-bus promise. 4. The README still documents the removed `labels` array (README.md:276-300) and leaves KeyboardStepSource out of the position source list. 5. The CHANGELOG 1.4.1 entry lists `setAriaAttribute`, which does not exist. 6. Two bugs in EligiusEngine.switchTimeline (src/eligius-engine.ts:263-293):    - It calls destroy() on the outgoing position source but leaves it in the timelineProviders map, so switching back reuses a destroyed source.    - It broadcasts `this._activePositionSource.getDuration` (the function itself, never called) as the duration.  Fix these, add tests, and stop. The one place I cannot fully argue against expansion is the type-keyed provider model (see the proposal). It is a structural limit that fixing alone does not remove, though even that change is small and does not break anything.

- **integrator-first**: The core is mature, and I would not expand its feature surface. The timeline provider decomposition (IPositionSource/ISeekable/IContainerProvider/IPlaylist), the typed eventbus with generated metadata, the adapter layer that keeps the engine and eventbus apart, and the DOM-free `eligius/metadata` entry (tsdown.config.ts runs it as a separate build) are all well-designed extension points. The operation catalogue is broad, after spec 001-atomic-operations added forms, storage, HTTP, scroll, a11y and dates. Nobody embedding the engine needs more operations, controllers or the speculative sources in specs/position-source-ideas.md.  The weak part is integration: what happens when you drop the engine into a host app. The evidence: (1) dist/index.mjs imports lottie-web and video.js statically at the top. They are not marked optional (package.json has no peerDependenciesMeta and no sideEffects). EligiusResourceImporter pulls every operation, controller and provider in through namespace imports. So every consumer ships lottie and video.js, and the main entry cannot load in SSR. (2) EngineInputAdapter always binds a global hotkeys-js 'space' handler that calls preventDefault and toggles playback. The host cannot turn it off. (3) Errors in timeline actions are fire-and-forget. EligiusEngine._executeActionsForPosition calls exec() without awaiting or catching it, and Action.start logs with console.error and then rethrows. The result is an unhandled promise rejection that names the action but not the operation, and there is no engine event the host can subscribe to. (4) There is no supported way to register custom operations. ActionEditor.addStartOperation throws on any name that is not built in, and ConfigurationResolver.resolveOperation quietly stores `instance: undefined`, which only fails later at execution time. (5) The globals store (src/operation/helper/globals.ts) is module-level. It is shared by every engine on the page, and nothing in src calls clearGlobals on destroy, so remounts (React StrictMode, HMR) carry stale state over.  My verdict is mature, plus a targeted integration-hardening pass. That means the small, composable changes below: no new subsystems, no jQuery removal, no framework bindings. Replacing jQuery would be large, breaking, and touches every operation; the cost is not justified while hosts can still load the engine client-side. A React or Vue wrapper is a thin useEffect around createEngine and destroy, so it does not belong in the core. A stub `@diagnostics` alias in tsdown.config.ts with no src/diagnostics directory suggests observability was planned and never finished. Proposal 2 covers that gap without a new subsystem.

- **author-first**: The engine is mature in breadth but not in its core loop, so it needs targeted work rather than broad expansion. Breadth: src/operation/index.ts exports about 75 operations covering DOM, data, forms, storage, HTTP, control flow (when/otherwise/forEach with break and continue), date and text, plus parameterised reusable actions (requestAction plus startAction with actionOperationData). There are 8 controllers, 5 position sources and a rosetta locale system. For a configuration author, the catalogue is not the bottleneck. More operations would mostly be nice-to-have, so I do not propose any.  The real pain is in the core action loop.  (1) Timeline actions are dispatched by exact float key lookup. EligiusEngine._onTimeHandler is bound with identity `(x: number) => x` (src/eligius-engine.ts:388, changed from Math.floor in commit 7139a89b "Correctly implement fractional timeline position support"). _executeActionsForPosition then does `actions[position]` (src/eligius-engine.ts:792-800). RafPositionSource emits values quantised to tickInterval, so it mostly works. VideoPositionSource (`this.setPosition(this._player.currentTime())`, video-position-source.ts:301-303) and ScrollPositionSource (`scrollPercentage * duration`, scroll-position-source.ts:212) emit arbitrary floats, so a timeline action at start 3.5 almost never matches a key. Even on RAF, any skipped tick (a background tab or a frame longer than tickInterval) silently skips that action. Dispatch also ignores direction: scrolling backwards over an action's start key runs its startOperations, and TimelineAction.end has no active guard (src/action/timeline-action.ts), so passing an end key again re-runs endOperations. The README promises 0.1s fractional precision (README.md:71, 226) but delivers it only for RAF.  (2) Scroll and video timelines can only toggle state at discrete points. No operation can map timeline progress to a style value, even though ScrollPositionSource exists to drive things from scroll.  (3) Operation chains cannot read engine state (current timeline URI, position, duration, language). timeline-complete carries no arguments (src/eventbus/events/timeline-complete.ts), and timelineFlow is an empty placeholder (`ITimelineFlow = Record<string, never>`, EligiusFlowController does nothing). So "when chapter A ends go to B, otherwise C" needs customFunction.  Smaller issues for the auditors rather than expansion: timeline-complete is broadcast twice (eligius-engine.ts:410 and engine-eventbus-adapter.ts:85), so an eventAction on it fires twice. README.md:276-300 still documents the `labels` array removed in 2.2.0. customFunction silently does nothing when the function name is not registered.  Verdict: mature-plus-targeted-expansion. Proposal 1 is closer to a correctness fix and should come first. Proposal 3 is small and removes a recurring reason to use customFunction. Proposal 2 is the only real capability expansion and should be judged on whether scroll and video storytelling is a target use.

### Recommended by the judge

1. **Interval-crossing, direction-aware timeline action dispatch** (medium; source: author-first (proposal 1), merged with confirmed bugs at src/eligius-engine.ts:792, :780, :426)
   - Why: Verified: _executeActionsForPosition does actions[position] with an identity floor (src/eligius-engine.ts:388, 797). VideoPositionSource and ScrollPositionSource emit arbitrary floats, so mediaplayer and scroll timelines effectively never fire actions; on RAF any dropped frame skips an action silently. This is the structural fix behind three confirmed bugs (exact-key match at :792, skipped/backward positions at :780, looping restart not ending actions at :426) and the README's 0.1s precision promise. A sorted array plus (lastPosition, position] interval sweep with a seek-style reconciliation for backward motion and loop wrap is medium effort and changes no public API, schema or events.
   - Prerequisites: RafPositionSource clock fixes (absolute timestamp at raf-position-source.ts:150, resume/seek anchoring at :118), engine/adapter double-wiring fix (eligius-engine.ts:481/:505/:568, engine-eventbus-adapter.ts:137), stop() leaving actions active and _lastPosition stale (:187), TimelineAction.end active guard. An integration spec driving a factory-built engine with a real RafPositionSource must exist first so the new dispatch is tested against real ticks, not mocked positions.
2. **Engine error event with operation-level context** (small; source: integrator-first (proposal 2))
   - Why: Verified: EngineEvents (src/types.ts:24-50) has no error member, _executeActionsForPosition calls exec() and drops the promise, and Action.start console.errors then rethrows (action.ts:31-34), so a failing operation is an unhandled rejection naming the action but not the operation. CLAUDE.md requires errors to name the operation and relevant data. Adding error to EngineEvents plus a public engine-error eventbus event, annotating errors in executeOperation with systemName and index, and catching exec() promises uses only the existing emitter, eventbus and adapters. Small, additive, and it makes the fix pass verifiable: broken configurations fail loudly in tests.
   - Prerequisites: Recursive executeOperation stack overflow (action.ts:132) since the wrapping lands in the same function; destroy() aborting teardown on any error (eligius-engine.ts:447); engine/adapter double-broadcast fix so the error is not forwarded twice through EngineEventbusAdapter.
3. **Supported custom operation/controller registration with fail-fast resolution** (small; source: integrator-first (proposal 4), merged with confirmed bug at src/configuration/configuration-resolver.ts:152)
   - Why: Verified: resolveOperation (configuration-resolver.ts:144-156) stores instance: undefined for any unknown name, which is the confirmed bug at :152, while ActionEditor.addStartOperation throws for anything not built in. So the fluent API cannot author a custom operation and the resolver cannot catch a typo. An optional registry argument on EligiusResourceImporter, consulted before built-ins and reflected in getOperationNames(), plus a thrown 'Unknown operation X at <json path>' in resolveOperation, fixes the bug and opens the one extension point hosts actually need, without a plugin system.
   - Prerequisites: Action editors copying the action so edits never reach the configuration (action-editor.ts:142), since the editor changes build on a working write-back; schema generator skipping 8 operations and marking @dependency properties required (generate-schemas.ts:110, :236), so registered operations have a coherent schema story. CHANGELOG entry: configs with unknown but never-executed operations now fail at createEngine.
4. **Make lottie-web and video.js truly optional peers (lazy import)** (small; source: integrator-first (proposal 1))
   - Why: Verified: lottie-controller.ts:10 and video-position-source.ts:4 import them statically, package.json has peerDependencies but no peerDependenciesMeta or sideEffects. Every consumer with a plain RAF timeline ships both libraries and the main entry cannot be imported in SSR or a bare test runner. Moving the import into VideoPositionSource.init() (already async) and LottieController.attach() (already may return a Promise), with peerDependenciesMeta optional flags, is small and does not change the public API.
   - Prerequisites: LottieController detach/endPosition and label-localisation bugs (lottie-controller.ts:125, :195) and VideoPositionSource init never settling on load error (video-position-source.ts:326): the lazy import lands in exactly those code paths and their tests, so fix and test them first, then convert. src/test/setup.ts global lottie mock must be reworked for dynamic import.
5. **Optional per-timeline position source override** (medium; source: maturity-skeptic (proposal 1), merged with confirmed bugs at src/engine-factory.ts:390, src/eligius-engine.ts:275, :284)
   - Why: Verified: TTimelineProviderSettings is Partial<Record<TimelineTypes, ...>> (configuration/types.ts:43), so EngineFactory builds one source per type sized to the first timeline. This is the structural cause of two confirmed bugs (same-type timelines share one source sized to the first duration at engine-factory.ts:390; switching to another type uses an uninitialised source at eligius-engine.ts:275) and the switchTimeline destroy-then-reuse defect. Building one provider per timeline URI, with an optional per-timeline positionSource override falling back to the type default, fixes those and lets one config mix a scroll chapter with an autoplay chapter. The skeptic's own caveat stands: if sharing one video.js player across mediaplayer timelines is deliberate, keep the per-URI instances and duration fix but defer the override field.
   - Prerequisites: switchTimeline resolving early / staying suspended / ignoring position when looping (eligius-engine.ts:284), timeline.loop applied only on switch and never for the first timeline, factory destroy() ordering and leftover listeners (engine-factory.ts:156, :228). Lifecycle tests for activate/suspend/deactivate across switch-back through a factory-built engine must exist before the override field ships.

### Rejected by the judge

- **Progress-driven timeline actions for scrubbed animation (author-first, proposal 3)**: Large, puts author-written operations on every tick inside the 16ms budget, depends on the dispatch rewrite landing first, and the only evidence of demand is the unspecified position-source-ideas.md; revisit once dispatch and the RAF clock are fixed and a user asks for it.
- **Engine state readable from operation chains, plus URI on timeline-complete (author-first, proposal 2)**: The evidence is real (timeline-complete has args: [], ITimelineFlow is an empty placeholder) but the request events already exist and customFunction covers the gap, so it is convenience rather than a structural fix; the one cheap part, passing the URI on timeline-complete, should ride along with the fix for the double timeline-complete broadcast, and the dead ITimelineFlow/EligiusFlowController should be deprecated in that same pass.
- **Configurable input adapter: disable or scope the space hotkey (integrator-first, proposal 3)**: Verified real (hotkeys('space') is hardcoded at engine-input-adapter.ts:51) but it is a one-option change to a factory whose adapter wiring is itself broken; fold the togglePlayKey: false option into the EngineFactory/adapter rewiring fix rather than tracking it as a separate expansion.
- **Per-engine globals store, cleared on destroy (integrator-first, proposal 5)**: Verified that clearGlobals is defined and never called, but the minimum fix is a one-line clearGlobals() in the factory's destroy(); threading a per-engine store through IOperationScope and six operations is medium effort for a multi-engine scenario that is untested and unrequested, so do the one-liner as a bug fix and defer the store.

### Full proposal details

<details><summary>maturity-skeptic (1 proposals)</summary>

#### Optional per-timeline position source override (fix-shaped expansion)

- Problem: Provider settings are keyed only by timeline type: TTimelineProviderSettings = Partial<Record<'animation'|'mediaplayer', ...>> (src/configuration/types.ts:43). EngineFactory.createTimelineProvidersForConfig (src/engine-factory.ts:359-393) builds ONE position source per type, sized from the FIRST timeline of that type. That has three consequences: (a) a second 'animation' timeline with a different duration runs on a source sized for the first; (b) one config cannot mix a RAF-driven intro with a ScrollPositionSource or KeyboardStepSource story section, because both are 'animation'; (c) switchTimeline (src/eligius-engine.ts:272-280) shares and destroys these instances, so switching back reuses a destroyed source. The README presents Scroll and Keyboard sources as first-class, but you can only use one per type per config.
- Who benefits: Authors of multi-timeline stories (the Eligian DSL users) who want to mix clocks, e.g. a scroll chapter followed by an autoplay chapter, or timelines of different lengths.
- Design: Add an optional `positionSource?: IPositionSourceConfig` (and optionally `container`) to ITimelineConfiguration. In EngineFactory, build one ITimelineProviderInfo per timeline URI: use the timeline's own override if present, otherwise fall back to timelineProviderSettings[type], always constructed with that timeline's duration. The engine looks providers up by uri instead of type. switchTimeline deactivates rather than destroys, and destroy() runs only from engine destroy. No new operations, events or controllers. Run generate-schema for the new optional field. The public type of IEligiusEngine.timelineProviders changes shape internally, so keep it internal or keep a type-keyed view. Evidence that would change my mind (i.e. make this unnecessary): if the per-type sharing is deliberate (one shared video.js player across mediaplayer timelines), the fix should stay limited to the destroy/duration bugs and per-timeline duration, with no override field.
- Effort: medium; breaking: false; risk: Medium. The engine's timeline switch path has already needed a dedicated fix (#169). Per-URI instances raise resource use for video sources, and the change needs careful lifecycle tests: activate/suspend/deactivate across switch-back.

</details>

<details><summary>integrator-first (5 proposals)</summary>

#### Make lottie-web and video.js truly optional peers (lazy import)

- Problem: dist/index.mjs lines 6-7 statically `import lt from "lottie-web"` and `import vjs from "video.js"`, because src/controllers/lottie-controller.ts:10 and src/timelineproviders/position-sources/video-position-source.ts:4 import them at the top level, and EligiusResourceImporter imports every controller and provider as a namespace. package.json has no peerDependenciesMeta, so npm 7+ installs both, and no `sideEffects`, so bundlers cannot drop them. Every embedder pays for lottie (~250KB min) and video.js (~200KB+) even with a plain RAF timeline. lottie-web also reads `document` when it loads, which is part of why README.md:382 says the main entry needs a `window`.
- Who benefits: Every product embedding Eligius without Lottie or video: smaller bundles, fewer forced dependency upgrades, and fewer import-time crashes in SSR or test runners.
- Design: In VideoPositionSource.init() (already async per IPositionSource.init(): Promise<void> in src/timelineproviders/types.ts:75), replace the static import with `const {default: videojs} = await import('video.js')`. In LottieController, do the same in attach(), which IController already allows to return a Promise. Keep the types as `import type`. Add `peerDependenciesMeta: {"lottie-web": {optional: true}, "video.js": {optional: true}}` and `"sideEffects": false` to package.json. Leave the tsdown externals as they are. If the dynamic import fails, throw a clear error such as `VideoPositionSource requires the optional peer 'video.js'`. The public API does not change.
- Effort: small; breaking: false; risk: An async load inside attach or init adds latency the first time it runs. The tests mock lottie-web globally (src/test/setup.ts) and will need vi.mock to work with dynamic import. Consumers who relied on npm auto-installing the peers must now install them explicitly, so this needs a CHANGELOG note.

#### Engine error event with operation-level context

- Problem: src/eligius-engine.ts `_executeActionsForPosition` calls `executions?.forEach(exec => exec())` and drops the returned promises. src/action/action.ts:31-34 does `console.error(...)` and then `throw e`, so a failing operation inside a timeline action becomes an unhandled promise rejection. The message carries the action name but not the operation systemName or index, which CLAUDE.md's error-handling rule requires. EngineEvents in src/types.ts has no error event. A host cannot route these failures to Sentry, show a fallback, or fail a test, short of global unhandledrejection handlers.
- Who benefits: Product engineers who need production error reporting, and anyone writing integration tests who wants a broken configuration to fail loudly and in a way they can attribute.
- Design: Add `error: [error: Error, context: {actionName: string; actionId?: string; operation?: string; operationIndex?: number; phase: 'start' | 'end' | 'seek' | 'init'}]` to EngineEvents, and a matching public `engine-error` event in src/eventbus/events/ so configuration event actions can react too. In Action.executeOperation, wrap `operationInfo.instance.call` and the promise branch so errors are annotated with systemName and index, for example through a small EligiusOperationError subclass with `cause`. In the engine, attach `.catch(e => this._emitter.emit('error', ...))` to the `exec()` calls in `_executeActionsForPosition`, `_executeActions` and `_handleTimelineComplete`. Keep console.error only when nobody listens. EngineEventbusAdapter forwards the event. This uses the existing TypedEventEmitter, the eventbus and the adapters, with no new subsystem.
- Effort: small; breaking: false; risk: Errors that used to escape as unhandled rejections would now be swallowed into an event. If no listener is present it should keep logging, so failures do not become silent. The error message format changes slightly.

#### Configurable input adapter: let hosts disable or scope the space hotkey

- Problem: src/adapters/engine-input-adapter.ts:50-52 always calls `hotkeys('space', ...)` on hotkeys-js's page-wide singleton. The handler calls `preventDefault()` and toggles engine playback. EngineFactory.createEngine always connects it, and IEngineFactoryOptions (src/types.ts) only accepts `eventbus`. Any host app that uses space for its own controls, page scroll or a media player loses that key. With two engines on one page, a single press toggles both. The resize listener also cannot be turned off.
- Who benefits: Hosts that embed Eligius as one widget among others, pages with several engine instances, and apps with their own keyboard handling.
- Design: Extend IEngineFactoryOptions with `input?: {togglePlayKey?: string | false; hotkeyScope?: string; element?: HTMLElement; resize?: boolean}`. Pass it into the EngineInputAdapter constructor. Skip binding when the value is false, use hotkeys' `scope` or `element` options when given, and keep the current behaviour as the default. Because hotkeys-js is already a dependency, this needs no new library.
- Effort: small; breaking: false; risk: Low. The default behaviour stays the same. Scoping by element depends on hotkeys-js's element option, which needs a test.

#### Supported custom operation/controller registration with fail-fast resolution

- Problem: Hosts often need app-specific operations, such as dispatching to their store or calling their analytics. Today the only route is a hand-written ISimpleResourceImporter. EligiusResourceImporter (src/importer/eligius-resource-importer.ts) has a hard-coded lookup with no extension point. The fluent API refuses custom names: ActionEditor.addStartOperation throws `Unknown operation` unless the name is in the built-in `operations` namespace (src/configuration/api/action-editor.ts:126-127). Meanwhile ConfigurationResolver.resolveOperation (src/configuration/configuration-resolver.ts:144-155) accepts any name and stores `instance: undefined`. A typo therefore surfaces only at playback, as `Cannot read properties of undefined (reading 'call')`. That contradicts the rule that configuration should fail fast and name the JSON path.
- Who benefits: Integrators who extend the engine with domain operations, controllers or position sources, and anyone debugging a configuration typo.
- Design: Give EligiusResourceImporter an optional constructor argument `{operations?, controllers?, positionSources?, containerProviders?, playlists?}`, checked before the built-ins, and have getOperationNames() and the related methods include those entries. Let ConfigurationFactory and ActionEditor take an optional IResourceImporter, or a list of extra operation names, so the name check accepts registered custom operations. In resolveOperation, throw `Unknown operation 'xyz' at timelines[0].timelineActions[3].startOperations[1]` when the import returns undefined. This means threading a path string through the resolve* functions. EngineFactory._importSystemEntry already throws for engines and providers, so this makes operations behave the same way.
- Effort: small; breaking: false; risk: Resolution now fails fast. A configuration that holds an unknown but never-executed operation used to load and will now throw at createEngine. That is correct behaviour, but it is observable and belongs in the CHANGELOG.

#### Per-engine globals store, cleared on destroy

- Problem: src/operation/helper/globals.ts keeps `const cache = {}` at module level. setGlobalData, addGlobalsToOperation, log, setData and resolveExternalPropertyChain all read and write that one object. Nothing in src calls clearGlobals (grep only finds its definition). Two engines on one page therefore share and overwrite each other's globals. Destroying and recreating an engine, as React StrictMode double-mounts, HMR, route changes and test files all do, leaves the old values behind, so the new instance does not start clean. This breaks CLAUDE.md's 'avoid global state' and 'long-running timelines must not accumulate memory' rules.
- Who benefits: SPAs that mount and unmount presentations, pages with several engines, and consumers' test suites that create engines repeatedly.
- Design: Create the globals store in EngineFactory.createEngine, one per engine, and expose it to operations through IOperationScope (for example `this.globals`), which Action._initializeScopeStack sets up. The helper functions take the scope's store and fall back to the module-level cache only when no scope is present, for backward compatibility. The `destroy()` returned by createEngine clears it. Operations that use globals switch from importing getGlobals to `this.globals`. This touches roughly six operation files and the property-chain helper.
- Effort: medium; breaking: false; risk: Configurations that deliberately shared globals across engines would stop doing so. That is an unlikely pattern, but it should be documented. Arrow-function operations cannot use `this`, so the affected operations must be ordinary functions, or receive the store some other way.

</details>

<details><summary>author-first (3 proposals)</summary>

#### Interval-crossing, direction-aware timeline action dispatch

- Problem: Timeline actions fire only when a position source emits a value exactly equal to an action's start or end key: `actions[position]` in EligiusEngine._executeActionsForPosition (src/eligius-engine.ts:792-800), with an identity floor since commit 7139a89b (line 388). VideoPositionSource and ScrollPositionSource emit raw floats (video-position-source.ts:301-303, scroll-position-source.ts:212), so authored actions on mediaplayer and scroll timelines effectively never fire. On RAF, a skipped tick (background tab, or a frame longer than tickInterval) drops actions silently. A start key that is not a multiple of tickInterval (for example 1.25 with tickInterval 100) never fires, and nothing validates it. Backward motion that is not a seek (scrolling up) runs startOperations when crossing a start key, and TimelineAction.end has no `active` guard, so crossing an end key again re-runs endOperations. The README promise of fractional positions (README.md:71, 226) holds only for RAF.
- Who benefits: Every author of video-synced or scroll-driven configurations, and Eligian users whose authored times are exact decimals. Today they can only drop to customFunction or accept missing actions.
- Design: Keep the per-URI sorted lookup, but store it as a sorted array of {position, method} built in _createTimelineLookup instead of a Record keyed by float. In _onTimeHandler, compute the half-open interval (lastPosition, position]. Going forward, run every end method whose key falls in the interval, then every start method, in position order, keeping the existing ordering rules in sortActionsPerPosition. Going backward (position < lastPosition, not a seek), reuse _executeSeekActions semantics: end the active actions whose range no longer contains the position and start the inactive ones whose range does. Large jumps (more than N seconds, or after a boundary loop reset) also go through _executeSeekActions. Add an `if (!this.active) return` guard to TimelineAction.end. With an epsilon compare (for example 1e-6), 0.1 keys keep working on RAF. No public API, configuration schema, event or operation changes. The 'time' and 'timeline-time' emissions are unchanged.
- Effort: medium; breaking: false; risk: Behaviour change: actions that silently never fired on video or scroll timelines will start firing, which may surface latent configuration mistakes. The tick handler must stay well under 16ms: a binary search into the sorted array plus a slice is O(log n + k), cheaper than today's object lookup when nothing fires. Ordering between end and start methods at the same position must keep matching current tests in src/test/unit/eligius-engine.spec.ts. Loop wrap-around (boundary 'start' resets to 0) must be treated as a seek, not as a backward scrub.

#### Engine state readable from operation chains, plus URI on timeline-complete

- Problem: Operations cannot read the current timeline URI, position, duration or language into operation data. The request events exist (request-current-timeline-position, timeline-request-current-timeline, request-current-language, timeline-duration-request in src/eventbus/events/index.ts), but only specific operations call eventbus.request internally (requestAction, getControllerInstance, getImport, customFunction). timeline-complete has `args: []` (src/eventbus/events/timeline-complete.ts), so an eventAction on it cannot tell which timeline finished. The declarative alternative, `timelineFlow`, is a placeholder (`ITimelineFlow = Record<string, never>` in src/configuration/types.ts:132; EligiusFlowController stores it and does nothing). As a result, chapter chaining, branching narratives ("after intro go to A if $globaldata.choice=='a' else B") and conditional logic on the current language all need customFunction.
- Who benefits: Authors of multi-timeline presentations, quizzes and branching stories, and the Eligian DSL, which can then compile `on timeline complete` and `if current timeline == ...` without emitting custom functions.
- Design: (a) Add an operation `getEngineState` (category Engine) with data `{properties?: ('currentTimelineUri'|'position'|'duration'|'language')[]}`. It calls the existing request events through this.eventbus.request and writes the values onto operation data as @output properties. It uses a fixed whitelist, not an arbitrary event name, so configuration cannot invoke arbitrary request handlers. Usable straight away with `when`, for example `$operationdata.currentTimelineUri=='intro'`, followed by `broadcastEvent` of `request-timeline-uri`. (b) Change CompleteEvent to `args: [uri: string]` and pass this._currentTimelineUri in EligiusEngine._onCompleteCallback. Listeners that ignore arguments are unaffected. Regenerate with npm run events-metadata. (c) Either delete ITimelineFlow and EligiusFlowController, or mark them @deprecated in favour of this pattern, so authors are not shown a dead configuration key in the JSON schema. Removal would need a major version; deprecation is minor.
- Effort: small; breaking: false; risk: Low. The new operation only reads state. Adding a tuple element to timeline-complete changes the generated EventMap type for TypeScript consumers that typed a listener as `() => void`, but that still compiles, because extra arguments are allowed. The double broadcast of timeline-complete (eligius-engine.ts:410 and engine-eventbus-adapter.ts:85) should be fixed at the same time, or branching eventActions will fire twice.

#### Progress-driven timeline actions for scrubbed animation

- Problem: Timeline actions are binary: startOperations at start, endOperations at end. The only animation operations are jQuery `animate` (wall-clock duration, src/operation/animate.ts) and `animateWithClass` (CSS), and both play at their own speed whatever the timeline position does. With ScrollPositionSource, whose purpose is mapping scroll to time, an author cannot express "fade #hero from opacity 1 to 0 as the user scrolls from 10s to 12s" or "move the marker with the video between 30s and 40s". The only workaround is an eventAction on timeline-time, with `when` guards around a range and `calc` plus `setStyle`. That runs for every action on every tick, gives no clean progress value, and breaks on seek. In practice authors write a customFunction. position-source-ideas.md (MousePositionSource, TouchDragSource, SliderInputSource, DeviceOrientationSource) assumes scrubbing as the main use, which binary actions cannot serve.
- Who benefits: Authors of scroll-driven storytelling, scrubbed explainers, and video overlays that should track playback continuously, plus any future scrub-style position source.
- Design: Add optional `progressOperations` to ITimelineActionConfiguration (an optional property, so the schema change is additive). TimelineAction gains `progress(position)`, which, while active, runs progressOperations with operationData `{progress: (position-start)/(end-start) clamped 0..1, position}`. The engine calls it from the same _onTimeHandler pass for currently active actions that define progressOperations, kept as a small separate list so actions without progress cost nothing. On seek, call progress once after the start/end reconciliation, so state is correct after a jump. Pair it with one operation, `interpolateStyle` (category Animation), with data `{selectedElement (@dependency), properties: Record<cssProp, [from, to]>, unit?, easing?: 'linear'|'easeIn'|'easeOut'|'easeInOut'}`. It reads `progress` from operation data and writes interpolated values through jQuery .css. Fluent API: add `addProgressOperation` to TimelineActionEditor. Reuse selectElement inside progressOperations, or cache the selection from startOperations through the action's operation data.
- Effort: large; breaking: false; risk: Performance is the main risk. progressOperations run per tick, so the 16ms tick budget depends on the author. Mitigate by running them synchronously only, rejecting async operations in progressOperations at resolve time (ConfigurationResolver, with an error naming the JSON path), and documenting that DOM reads cause reflow. Semantics need care: progress after end (clamp to 1, then endOperations), and interaction with the dispatch change in proposal 1, which should land first. Scope is easy to creep (keyframes, colour interpolation), so keep v1 to numeric CSS values.

</details>

## Duplicates

- [eligius-engine.ts:797](src/eligius-engine.ts#L797) **Exact float-key dispatch misses actions for video/scroll/keyboard and skipped ticks** duplicates "Actions only fire when the reported position exactly equals a configured key". The code matches the report. At src/eligius-engine.ts:388 the "floor" passed in is the identity function `(x: number) => x`. At lines 782-798, `_onTimeHandler` hands the raw position to `_executeActionsForPosition`, which looks it up exactly with `actions[position]`. So fractional positions from video or scroll, accumulated float error in keyboard steps, and skipped ticks all miss their action keys. That is the defect already in the confirmed list as "Actions only fire when the reported position exactly equals a configured key" (eligius-engine.ts:792). Scenario (c), skipped ticks leaving actions un-started or un-ended, also overlaps the confirmed "Skipped or backward positions leave actions un-started, un-ended or ended twice" (line 780). The subtitles bug "Subtitles never show during video playback because positions are fractional" is the same symptom in another component. Every symptom in this report, including the extra timeline-time broadcasts, comes from that one root cause: positions are never quantised and there is no interval-crossing dispatch. It adds no new defect.
- [when.ts:101](src/operation/when.ts#L101) **when: quoted string constants are documented but never unquoted** duplicates "when() never strips quotes from string literals, so string comparisons always fail". The trace holds. In src/operation/when.ts:86-107, parseExpression splits on the operator. If an operand does not parse as a number, it goes to resolveExternalPropertyChain (src/operation/helper/resolve-external-property-chain.ts:29-43). That function only handles the $operationdata./$globaldata./$scope. prefixes and otherwise returns the input string unchanged, quotes included. So the expression "$operationdata.name=='x'" compares 'x' === "'x'" and evaluates to false. No guard elsewhere strips the quotes. This is the same root cause as the already-confirmed bug "when() never strips quotes from string literals, so string comparisons always fail". The extra point in this report, that the documented @foo variable syntax is not implemented (there is no '@' handling in isExternalProperty or parseExpression), is a JSDoc inaccuracy in the same function and fits under the same fix.
- [engine-eventbus-adapter.ts:55](src/adapters/engine-eventbus-adapter.ts#L55) **Every engine state event is broadcast twice (engine plus adapter), including per tick** duplicates "Engine and EngineEventbusAdapter both handle eventbus commands and broadcast events". The behaviour is real. EngineFactory.createEngine builds and connects EngineEventbusAdapter (src/engine-factory.ts:201, 217). The adapter's _subscribeToEngineEvents (src/adapters/engine-eventbus-adapter.ts:44-96) rebroadcasts each engine event onto the eventbus. EligiusEngine already broadcasts the same events right after emitting them, for example: start at 167-168, pause at 180-181, stop at 193-194, seek at 215-234, timelineChange at 267-268, complete/firstframe/restart at 409-428, and the per-tick time event at 786-787. So factory-built engines deliver every timeline-* broadcast twice. I found no guard that prevents this. The root cause is the one already confirmed as 'Engine and EngineEventbusAdapter both handle eventbus commands and broadcast events' (eligius-engine.ts:481): the engine and the adapter both bridge to the eventbus. That entry explicitly covers the broadcast half as well as the command half. This report is a different symptom of the same defect (double delivery instead of play-toggle cancelling itself), so it is a duplicate. The detail about timeline-duration carrying an unbound getDuration may be a separate small defect, but it goes away with the same fix of keeping a single bridge.
- [engine-factory.ts:242](src/engine-factory.ts#L242) **Factory result destroy() leaves the event-action listener and interceptor on the eventbus** duplicates "Per-engine destroy() leaves interceptor and action-registry listener on eventbus". The report is accurate. In src/engine-factory.ts, createEngine pushes the ActionRegistryEventbusListener (line 156-158) and the RequestVideoUriInterceptor (line 161-165) onto the factory-level this._eventRemovers. Only factory.destroy() (lines 93-95) runs those removers. The per-engine destroy closure (lines 226-235) disconnects the three adapters and calls engineInstance.destroy(), but it never removes the listener or the interceptor. The "confirmed" array already holds this exact defect as "Per-engine destroy() leaves interceptor and action-registry listener on eventbus": same file, same removers, same fix (keep per-engine removers in the createEngine closure). The interceptor stacking when createEngine is called again is a second symptom of that same root cause.

## Refuted reports

<details><summary>Refuted</summary>

- [lottie-controller.ts:140](src/controllers/lottie-controller.ts#L140) **Deferred Lottie _destroy can destroy a newer animation after re-attach** (opus): The scenario cannot happen. Re-attaching calls attach(), which calls _createAnimation(). Line 152 of src/controllers/lottie-controller.ts runs `this.animationItem?.destroy()` on the old item, which is still playing out, before it builds the new one. lottie-web's AnimationItem.prototype.destroy (node_modules/lottie-web/player/js/animation/AnimationItem.js:623-640) sets `this._cbs = null` and `this.renderer = null`, so the old item's 'complete' listener is gone and can never fire. That means the deferred _destroy can never run against the new item. The language-change path is not reachable either: detach() calls super.detach() at line 122, which removes the 'language-change' listener before the play-out starts. The "double destroy" part is harmless, because lottie's destroy() returns early when `!this.renderer` (AnimationItem.js:624), so a second destroy on an already destroyed item does nothing. The only real gap is cosmetic: the listener is never removed explicitly and animationItem is not nulled in the else branch. Neither has a visible effect. There is no lottie-controller spec in src/test/unit/controllers. A separate confirmed bug ("Lottie detach never destroys immediately; endPosition is always set from timeCompleted") covers the other real defect in this detach path.
- [filter-array.ts:24](src/operation/filter-array.ts#L24) **filterPredicate/findPredicate cannot be passed as configured operation data** (opus): The mechanism the report describes is real. src/action/action.ts:90 runs `deepCopy(operationInfo.operationData ?? {})`, and src/operation/helper/deep-copy.ts:3-6 uses structuredClone, which throws DataCloneError on a function value. But that failure can only happen when a function is placed in configured operationData, and a valid Eligius configuration cannot hold one. Configurations are JSON validated against jsonschema/eligius-configuration.json, JSON has no function type, and the generated schema contains no filterPredicate entry at all. The project rules in CLAUDE.md also forbid running arbitrary code from configuration. So the scenario is not reachable from a valid configuration.  The documented examples in the filterArray TypeDoc (filter-array.ts:41-62) call `filterArray({...})` directly. That path skips Action and deepCopy, and it works, as src/test/unit/operation/filter-array.spec.ts:48 and :125 show. When a previous operation supplies the predicate through previousOperationData, it is merged after the copy (action.ts:92), so that path works too.  The only real defect is cosmetic. filterPredicate (and findPredicate in find-in-array.ts) is tagged @optional/@erased rather than @dependency. Because of that, the generated metadata (src/operation/metadata/filter-array.ts) lists a function type as a configurable property, which could mislead editor tooling such as Eligian. That is a metadata labeling issue, not a runtime bug reachable from a valid config or a documented public API call. Severity is low at most.
- [is-promise.ts:2](src/util/guards/is-promise.ts#L2) **isPromise(null) throws TypeError, crashing the action chain when an operation returns null** (opus): I read the guard and confirmed the narrow claim: isPromise(null) throws, because typeof null === 'object'. The failure still can't be reached from a valid configuration or a documented API.  1. Every operation in an action chain comes from the built-in operation registry, and none of the built-in operations returns null. A grep for "return null" in src/operation/*.ts finds nothing. The only operation that runs user code is customFunction (src/operation/custom-function.ts, lines 24-48). It ignores the custom function's return value and always returns operationData or a Promise that resolves to it. So a null result never reaches action.ts:117. Custom operation registration does not exist; the audit lists it only as a proposed expansion. 2. The type contract forbids a null result. TOperation returns TOperationResult<RT>, and RT is bound to TOperationData = Record<string, any> (src/operation/types.ts:4 and :64-67). In strict mode null is not assignable to that type. 3. Even with a hardened isPromise, a null result would still crash on the next step. At action.ts:84, Object.assign(previousOperationData, copy) is called with null and throws a TypeError as well. A null return is outside the engine's operation contract, not a defect in this guard.  The only problem left is hardening: isPromise is a non-exported utility with no unit test, and it could check for null. Low severity.
- [end-action.ts:41](src/operation/end-action.ts#L41) **endAction deletes existing operation data keys that collide with actionOperationData** (opus): The trace is correct: src/operation/end-action.ts:40-41 drops every key that is in actionOperationData, including keys the operation data already had before the merge. But this is the documented contract, not an accident. The TypeDoc at end-action.ts:21-23 says: "The action operation data is first merged with the current operation data ... After the action has completed the action operation data properties are removed from the current operation data." startAction (src/operation/start-action.ts:18-23, 41-43) documents and implements the same semantics by deleting every actionOperationData key. So the two operations are consistent with each other and with their docs.  The failure scenario is also contrived. It needs actionOperationData to contain `selectedElement`, which is a jQuery object produced at runtime (a @dependency), not something a JSON configuration supplies. In real configs actionOperationData carries parameters such as selector or className, and most earlier operations erase those keys (they are @erased), so a collision with live upstream data is rare.  The existing spec (src/test/unit/operation/end-action.spec.ts) only covers keys that don't collide. It neither proves nor disproves the collision case. At most this is a design improvement: snapshot and restore keys that collide in both startAction and endAction. It is not a defect against documented behaviour. Severity: low.
- [extend-controller.ts:33](src/operation/extend-controller.ts#L33) **extendController lets a `__proto__` key replace the controller's prototype** (opus): The mechanism is real, but it is not a defect. A nested `__proto__` key inside controllerExtension does survive structuredClone in deep-copy.ts:4 and action.ts:90. The outer Object.assign in action.ts:92 only touches top-level keys, so the nested key reaches Object.assign at extend-controller.ts:33. There it calls the __proto__ setter on that one controller instance.  That still does not make it a bug or a security issue, for three reasons.  1. It is not prototype pollution. Object.assign(target, {__proto__: X}) only changes the prototype of `target`, which is that single controller instance. Object.prototype and LabelController.prototype are unchanged, so no other object is affected. The CLAUDE.md rule targets property-chain resolution that reaches shared prototypes; that defect is already tracked separately as the setData __proto__/constructor bugs.  2. The operation exists to let the configuration overwrite arbitrary members of the controller. That is its documented purpose: `controllerExtension: Record<PropertyKey, unknown>`, merged with Object.assign. A configuration can already break detach with `{"detach": 1}`, or replace any method. Adding `__proto__` gives the configuration author no capability they did not already have through this operation.  3. The configuration author is the only one who can do this, and they can only break their own controller instance. No valid configuration that means something reaches this by accident. The failure needs a deliberate, nonsensical `__proto__` key, and the consequence is self-inflicted.  The existing spec (src/test/unit/operation/extend-controller.spec.ts) only covers ordinary merging. That is consistent with the intended "overwrite anything" semantics. At most this is a hardening nicety, not a bug.

</details>
