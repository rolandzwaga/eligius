# Change Log

## Unreleased

### Performance

- Property chains, `when` expressions and `setData` targets are parsed once and cached (`src/operation/helper/chain-cache.ts`, `expression-cache.ts`). Before, every execution split, lower-cased, bracket-expanded and safety-checked the chain text again. Error messages are unchanged. The caches are bounded and are cleared when the last engine is destroyed, like the global data store.
- `deepCopy` assigns plain keys instead of defining them and creates its cycle map only when nested data appears, about 3x faster on typical configured operation data. The result is identical, including an own `__proto__` key staying a data property.
- The block scans of `when`, `otherwise`, `forEach`, `breakForEach` and `continueForEach` share one allocation-free implementation (`src/operation/helper/flow-control-index.ts`).
- Measured with `npm run bench`: a 13-operation action with a 20-item `forEach` runs in 0.095 ms instead of 0.194 ms (2.0x), the same action without the loop in 0.012 ms instead of 0.016 ms, and a 200-item loop in 0.79 ms instead of 1.58 ms. See specs/007-aot-compiler/measurements.md.

### Internal

- A differential test harness (`src/test/differential/`) runs 32 pinned interpreter quirks and 1000 fuzzed operation lists per run through both the interpreter and a pinned copy of the previous one, and requires identical data, traces, errors and globals. fast-check is a new devDependency.
- `src/operation/helper/find-matching-operation-index.ts` is removed; it was not exported.

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

### Added

- **`loadTimeout` for `VideoPositionSource`**, in milliseconds (default `30000`, `0` disables it). `init()` rejects with `VideoPositionSource: failed to load video (<sources>): no source became playable within <n> ms` when no source has become playable by then. Without it, media the browser accepts but never finishes loading or reports as failed (seen in WebKit with a WebM it reported it could play) left `init()`, and so `engine.init()`, pending forever; 3.x behaved the same.

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
- `VideoPositionSource.seek()` settles at once with the media's current time when the media has a fatal error or nothing is seekable, instead of waiting for a `seeked` event that never comes. A seek before the media metadata has loaded resolves at once with the requested position, and playback starts there (video.js deferred it and resolved on a later `seeked`). Once the metadata has loaded, a seek waits for `seeked` as before.
- `VideoPositionSource.destroy()` releases the media (pauses, removes the sources, aborts the download, removes the element) and drops registered container-ready callbacks.
- A `VideoPositionSource` `selector` that matches several elements gets one video element, in the first match (3.x appended a `<video>` to every match and played the first).

## 3.1.0

### Added

- **`KeyboardController`** runs actions on a key press, for example `{"keys": "ArrowRight", "actions": ["NextChapter"]}` on the timeline container. `keys` uses hotkeys-js syntax (`'right'`, `'shift+right, space'`), and the `KeyboardEvent.key` names of the same keys work too (`'ArrowRight'`, `'Escape'`, `'PageDown'`). Unknown key names throw in `init`. The actions run in order like those of `DOMEventListenerController` (`end:` prefix, `actionOperationData`, a failure skips the rest and goes to `reportError`) and receive `eventTarget` and `eventKey`. With `scope: 'document'` (the default) it listens while the focus is inside the engine root or nothing has focus; with several engines one engine handles an unfocused press, chosen like the play toggle. With `scope: 'element'` it listens only while the focus is inside the selected element. Presses in `input`, `select`, `textarea` and contenteditable elements, and key repeats, do not run the actions.
- **`DOMEventListenerController` passes `eventKey`** (`KeyboardEvent.key`) next to `eventTarget` for key events.
- **`KeyboardStepSource.setEngineRoot()`**, which `EligiusEngine` calls for every source it wires, so the source knows which engine's KeyboardControllers it yields to.

### Changed

- **A `KeyboardController` takes a shared key over from the play toggle and from `KeyboardStepSource`.** When its keys include the engine's play toggle hotkey (space by default) or a key the engine's `KeyboardStepSource` binds (the arrow keys, `shift+left`/`shift+right`, `home`, `end`), a press the controller handles runs its actions and no longer also toggles playback or steps the timeline. Presses the controller ignores still do. A `KeyboardStepSource` used without an engine handles every press of its keys, as before.

## 3.0.1

### Fixed

- **Operation metadata used parameter types that `TParameterTypes` did not list.** Since 3.0.0 the generated metadata of `replaceString.pattern`, `replaceText.searchPattern` and `splitString.delimiter` used `ParameterType:RegExp`, and `setElementContent.template` used `ParameterType:Element`, `Text`, `Comment`, `Document` and `DocumentFragment`. These six names are now members of `TParameterTypes`. They map to the JSON type `object` for `@type` tags: these values reach an operation at runtime, through the operation data of an earlier operation. TypeScript consumers that hold a `Record<TParameterTypes, ...>` must add entries for the new names.
- **The metadata generator fails on an unknown parameter type.** `npm run metadata` now stops with an error naming the property and its TypeScript type (or `@type` tag) when a type maps to a name outside `PARAMETER_TYPES`, instead of writing that name into the metadata. A test checks every operation and controller metadata type against the list.

### Added

- **`PARAMETER_TYPES`**, the runtime list of every `TParameterTypes` value, exported from `eligius` and `eligius/metadata` (not from the `metadata` namespace, which still holds only metadata functions). `TParameterTypes` is derived from it.

## 3.0.0

Release from two full codebase audits (reports in `specs/main/codebase-audit-report.md` and `specs/main/codebase-audit-report-2.md`). About 190 confirmed bugs are fixed, each with a regression test, and the second audit's improvements, optimisations, expansions and test gaps are done. Major release because of the breaking changes below; read them before upgrading from 2.x.

### Breaking Changes

- **`EligiusEngine` no longer wires itself to the eventbus.** The engine and `EngineEventbusAdapter` both handled eventbus commands and both broadcast engine events, so every command ran twice (play-toggle cancelled itself) and every event was sent twice. The adapter is now the only owner.
  - Was: a directly constructed `new EligiusEngine(...)` answered `timeline-play-request`, `timeline-pause-request`, `timeline-stop-request`, `timeline-seek-request`, `timeline-play-toggle-request` and `request-timeline-uri`, and broadcast `timeline-*` events.
  - Now: connect `new EngineEventbusAdapter(engine, eventbus).connect()` yourself. `EngineFactory.createEngine` already does this, so factory users need no change. Callback-style queries (`request-engine-root`, `request-current-timeline-position`, `timeline-duration-request`, and so on) still work without the adapter.
- **Each engine gets its own eventbus.** `EngineFactory.createEngine` now creates a fresh eventbus per engine unless `options.eventbus` is passed, so engines on one factory no longer answer each other's requests. Pass a shared `options.eventbus` to keep the old sharing; the factory warns when a second live engine uses it.
- **Stricter configurations.** These were accepted before and now throw with the JSON path: a timeline type without a `timelineProviderSettings` entry, a `config:` placeholder that resolves to `undefined`, a `template:` or `json:` name the importer does not have, a missing operation list, `duration.end` lower than `start`, controller or class names used as operations, unknown `when` operands, and unknown navigation ids. The JSON schema now requires operation `id`.
- **Requires `"DOM"` in the consumer's TypeScript `lib`.** The DOM-free entries no longer need jquery or lottie-web types, but their declarations still use DOM types such as `HTMLElement`.

### Added

- **Engine error event.** `EligiusEngine` emits `error` with an `EngineActionError` (action name, id, phase, cause, and the failing operation's `systemName` and index) when an action it starts or ends fails. `EngineEventbusAdapter` forwards it as the public `engine-error` eventbus event. Without listeners the message is logged.
- **`eligius/configuration-api`**, a DOM-free entry for the fluent `ConfigurationFactory`, so build tools can create configurations in plain Node. The `...ByType` methods need the main `eligius` entry; elsewhere use the name-based methods.
- **`Eventbus` option `onHandlerError`** to observe errors thrown or rejected by handlers, listeners and interceptors.
- **Compound `when` conditions:** `&&`, `||`, `!` and parentheses with standard precedence and short-circuit evaluation, through a small parser (no `eval`). A bare operand is tested for truthiness.
- **Self-contained type declarations** for all three package entries. `eligius/metadata` and `eligius/configuration-api` type-check without jquery or lottie-web; the main entry references `@types/jquery` (new optional peer). `npm run check:types` verifies this against throwaway consumers under NodeNext, Bundler and Node10 resolution, and CI runs it.
- Events `engine-command-error` and `request-translation`; `IEventbus.reportError`; typed requests through a generated `RequestMap`.
- `IEngineFactoryOptions.engineOptions` (`maxCatchUp`) and `playToggleHotkey` (`string | false`); `IPlaylist.hasItem?`; `sources` in `IPositionSourceConfig`; `ILocaleLoaderOptions.timeoutMs` and `signal`; the `clearJsonCache` export.
- Navigation entries can carry a `timelineUri`, so NavigationController and RoutingController drive timeline switches. KeyboardStepSource `timeline-switch` mode is handled by the engine.
- `animateWithClass` option `includeDescendants`.
- **Per-timeline position sources.** Optional `positionSource` and `containerProvider` on each timeline, merged over `timelineProviderSettings[type]` (a different `systemName` replaces the type settings). One configuration can mix a RAF intro with scroll or keyboard chapters, scroll different containers, and give mediaplayer timelines different videos. Fluent API: `ConfigurationFactory.setTimelinePositionSource()` and `setTimelineContainerProvider()`.
- **Configurable input bindings.** `IEngineFactoryOptions.input` with `playToggle` (`string | false`), `resize` (`boolean`) and `scope` (`'document' | 'engineRoot'`), plus the types `IEngineInputOptions` and `TEngineInputScope`.
- **Custom resource registration.** The `EligiusResourceImporter` constructor accepts `{operations, functions, controllers, templates, json, override}`. Registered entries are shape-checked, cannot shadow a built-in without `override: true`, and appear in `getOperationNames()`, `getControllerNames()`, the new `getFunctionNames()` and every "did you mean" hint. `ConfigurationFactory` options take `customOperations`, so the fluent API (including `eligius/configuration-api`) can author custom operations. New types `IEligiusResourceRegistrations`, `TControllerClass`, `TRegisteredResourceKind` and `IConfigurationFactoryOptions`. See the new README section "Extending Eligius".

### Changed

- **lottie-web and video.js are optional peer dependencies**, loaded on first use by `LottieController` and `VideoPositionSource`. Install them yourself if you use Lottie or video timelines; npm no longer installs them automatically. `LottieController.attach()` now always returns a Promise.
- **Eventbus error isolation.** A handler, listener or interceptor that throws or rejects during a broadcast no longer stops the remaining handlers or throws into the broadcaster. The error is logged with the event name and topic and passed to `onHandlerError`. Request responders still throw to the requester.
- **Event actions report failures.** `ActionRegistryEventbusListener.handleEvent` returns the started actions' promise, so a failing event action is reported through the eventbus error path instead of becoming an unhandled rejection. `IEventbusListener.handleEvent` may now return a promise.
- **Ordering.** Within one position update, starts wait for that update's ends to finish.
- **Unknown names fail loudly.** `EligiusResourceImporter.import` throws for unknown system names with a "did you mean" hint, instead of returning `{name: undefined}`. `customFunction` and `getImport` throw an error naming the operation and the unknown name. Unresolvable `template:` and `json:` placeholders name the placeholder.
- The fluent API and the name providers validate names against the generated metadata instead of importing the operation and controller implementations.
- **Transport commands are serialised.** `init`, `start`, `seek`, `switchTimeline` and `stop` run in call order; a later seek, stop or destroy supersedes a running seek, and nothing resumes after `destroy()`. `seek` and `switchTimeline` resolve once starts have begun, and `start`/`pause` emit only on a real state change.
- `RafPositionSource` defaults to a 100 ms tick (was 1000 ms), matching the documented 0.1 s precision. Scroll seeks are instant. KeyboardStepSource no longer changes the global hotkeys-js scope. Position-source registration methods may return an unsubscribe function.
- `Action` no longer logs failures; the engine reports them through its `error` event and logs message and cause when nobody listens.
- `startAction` and `endAction` give the inner action its own copy of the operation data, so its changes no longer flow back into the caller. `deepCopy` keeps class instances by reference.
- Variables set with `setVariable` or `setData` inside `when` and `forEach` blocks persist for the whole action.
- `LocaleManager.t()` returns `''` for namespace keys and non-string results; `$ref` locales time out after 30 s and are normalised before caching.
- Fluent API: duplicate action names throw, operation data is copied on the way in, name providers return arrays, and `addEndOperation`/`addStartOperation` type-check the data for the named operation.
- Many operations validate their input and throw named errors (`reparentElement`, `saveToStorage`, `replaceString`, `calc`, `math`, `modifyDimensions`, `requestAction`, `getControllerInstance`, `invokeObjectMethod`).
- Operation `@output` properties are optional and `@required` tags were corrected, so the generated JSON schema changed.
- `timelineProviderSettings`, or a type's entry in it, is no longer required when the timelines name their own `positionSource.systemName`.
- With several engines on one page and nothing focused, a play-toggle key press toggles one engine (the one last clicked or focused, otherwise the first created) instead of all of them.
- After a source is activated (start, resume or timeline switch), the engine reconciles its first reported position like a seek. A scroll container scrolled while its timeline was not playing no longer starts and ends every action between the old position and its offset.
- `getControllerInstance.systemName` accepts registered controller names.

### Security

- `LabelController` and `SubtitlesController` sanitize translation and subtitle text before inserting it. Inline formatting (`<br>`, `<strong>`, `<em>`, `<span>`, http, https, mailto and relative links) still renders; scripts, event handlers, `javascript:` and `data:` URLs, images, iframes and SVG are removed. `LabelController` refuses `on*` and `srcdoc` as `attributeName` and only writes safe URLs to URL attributes such as `href`.
- Configured operation data with its own `__proto__` key is rejected with an error naming the operation, instead of replacing the prototype of the running operation data.
- `invokeObjectMethod` only calls application code: plain objects and app class instances, never native or jQuery functions, host objects or `window`. Property chains can no longer reach the global object.
- `__proto__`, `constructor` and `prototype` keys are rejected or dropped at every depth: configured operation data, `extendController`, global and variable names, `getFormData` fields, and `getConfiguration(callback)` through `syncInPlace`.
- `reparentElement` rejects HTML and resolves its selector inside the engine root.
- `createElement` and `setElementAttributes` refuse event-handler (`on*`) and `srcdoc` attributes, and `javascript:`/`vbscript:` URLs in URL attributes such as `href`, `src`, `action` and `formaction`; `createElement` refuses `script` elements. Configurations that wrote `onclick`-style attributes through these operations now fail.
- `setElementContent` string templates are inserted as HTML and may run scripts; they must come from configuration or the importer, never from user data. Build content from user data with `createElement`.

### Performance

- Actions no longer deep-copy empty or primitive-only operation data on every execution, and `forEach` copies a literal collection once per loop run instead of once per iteration, so the cost grows with n rather than n².
- Ticks that cross no action boundary allocate nothing; the engine root is cached; `forEach` resolves a property-chain collection once per loop; ProgressbarController skips unchanged DOM writes; SubtitlesController finds the current subtitle in constant time while playing; `animationInterval` cancels its timer and frame on abort.

### Behaviour changes that may surface in existing configurations

- `ConfigurationResolver` now throws on unknown operation names, with the JSON path and the closest known name, and on duplicate action names. Such configurations were already broken at runtime.
- `LocaleManager.loadLocale` throws on unresolved `{$ref}` data; `EngineFactory` now resolves `$ref` locales itself (see Fixed).
- `LocaleManager.setLocale` with a locale that is not loaded falls back to the default locale with a warning.
- Property chains (`$operationdata`, `$globaldata`, `$scope`, `setData`, `invokeObjectMethod`) reject `__proto__`, `prototype` and `constructor` segments.
- `createElement` treats `text` as plain text. Use `setElementContent` for HTML.
- `animateWithClass` erases `className` and `removeClass`; `loadFromStorage` and `saveToStorage` erase `key`, matching their `@erased` tags.
- `loadJson` rejects on HTTP error statuses and returns copies of cached data. HTTP operations accept 204 and empty bodies.
- `clearStorage` throws on an empty or blank key instead of clearing all storage.
- `when` unquotes string literals and throws on an invalid expression.
- `engine.init()` rejects when a video fails to load, a container selector matches nothing, or a `$ref` locale fails to load. `engine.start()` rejects when autoplay is blocked. All of these used to hang or fail silently.
- Keyboard timelines emit `end` when stepping onto the end and no boundary on a backward wrap.
- A first timeline with `loop: true` now loops; before, `loop` was only applied on a switch.

### Deprecated
- Events `request-video-url`, `before-request-video-url`, `navigate-to-video-url`, `video-complete`, `request-video-cleanup`, `request-current-video-position`, `request-label-collections` and `request-label-collection` (the engine does not handle them; use navigation `timelineUri` and the timeline events).
- `EligiusEngine.sortTimelines`, `EligiusEngine.sortActionsPerPosition`, `Action._initializeScopeStack`, the default `scopeStack` of `executeOperation`, `SubtitlesController.actionLookup` and `subtitleDurations`, `LottieController.labelData` and `serializedIEData`, and the `iefallback` setting (now ignored).
- `IEngineFactoryOptions.playToggleHotkey` and `IEngineInputAdapterOptions.playToggleHotkey`; use `input.playToggle`.

### Fixed

- **Clock and dispatch.** `RafPositionSource` used the absolute frame timestamp as elapsed time and lost its position on resume and seek. Actions only fired when a position exactly equalled a configured key, so video, scroll and keyboard timelines and any skipped frame missed them. Dispatch now uses interval crossing over a schedule sorted once at init, with reconciliation on backward jumps, and start-only actions can no longer start twice.
- **Controller cleanup.** `destroy()` detaches controllers still attached to elements inside the engine root, so their eventbus listeners no longer leak.
- **Lifecycle.** Factory `destroy()` runs end operations before disconnecting adapters, keeps tearing down when one step throws, and removes the engine's event-action listener and interceptor. `stop()` ends active actions. Container providers are initialised and destroyed. The shared global data store is cleared when the last engine is destroyed, and `clearGlobals` is exported.
- **Timelines.** Each timeline gets its own position source and duration. `switchTimeline` initialises and wires the target source, honours the start position (also when looping) and resolves only once playback is set up.
- **Locale.** `language-change` no longer recurses. External `{$ref}` locale files are loaded by `EngineFactory`, and `init()` waits for them. `LocaleLoader` binds `fetch` and handles diamond references. `loadLocale` deep-merges.
- **Eventbus.** Broadcast iterates a snapshot, `once()` removes itself before running, and each event action gets its own operation data.
- **Operations.** `breakForEach`/`continueForEach` work inside `when` blocks. Nested `when` without `otherwise` no longer skips the outer branch. `customFunction` accepts non-promise returns. `startAction` settles without `actionOperationData`. `deepCopy` keeps functions, jQuery objects and DOM nodes. `reparentElement` keeps jQuery data and controllers. `createElement` no longer builds HTML from strings. Large `forEach` loops no longer overflow the stack. Smaller fixes in `animate`, `compareDate`, `formatDate`, `formatText` and `replaceText`.
- **Controllers.** Subtitles show at fractional positions. Lottie no longer creates its animation twice and destroys it on detach. Navigation and routing handle unknown hashes, build menus without HTML strings and can be re-attached. `RoutingController` listens for `popstate` with `addEventListener` instead of overwriting `window.onpopstate`, so it no longer replaces the host page's handler. `DOMEventListenerController` removes only its own handler. The progress bar handles zero durations, measures clicks against its container, and follows `timeline-duration` instead of requesting the duration on every tick.
- **Fluent API.** `ConfigurationFactory.getConfiguration(callback)` applies the callback's result in place instead of swapping in a copy, so editors that are still open keep editing the factory's configuration. The action and operation editors do the same.
- **`endAction`** always settles: it rejects with a named error when `actionInstance` is missing, and no longer hangs with an unhandled rejection when `actionOperationData` is omitted.
- **Position sources.** Video init and seek settle on errors and destroy; readiness uses `playing` instead of the non-existent `firstplay`. Scroll picks up existing scroll on activate and reaches its end boundary with fractional offsets.
- **Configuration and tooling.** Fluent API editors write back to the factory configuration. The schema generator covers every exported operation, no longer marks `@dependency` properties required, and keeps the definitions it references. Metadata generators handle optional properties, keep `@private` events in `EventMap`, and exit non-zero on failure. Operation and controller READMEs show descriptions and only link to existing schemas.
- **Second audit (75 confirmed bugs, report in `specs/main/codebase-audit-report-2.md`).** Overlapping seek, switch, stop and start leaving stale actions; pending switches resuming after `destroy()`; failing actions leaving half-finished seeks; failed source init cached as prepared; the RAF clock losing a tick on early frames and at loop wraps; scroll seeks returning before they land; keyboard steps accumulating float error; stale `activate()` rejections overwriting newer state; video init hanging without `sources`; `animateWithClass` resolving on descendant events or never settling; removed content keeping attached controllers; `validateForm` checkbox and multi-select; duplicate `Content-Type` headers; `once()` handlers that `off()` could not remove; locale `change` handlers not isolated; schema rejecting valid `forEach`, `setVariable` and `log` data; SubtitleImporter dropping ids and line breaks; Navigation and Routing controllers using events the engine no longer handles; MutationObserverController leaking on a second attach; and smaller fixes across controllers, operations and generators.
- The `typesVersions` mapping resolves `eligius/metadata` and `eligius/configuration-api` for Node10 consumers, and the stale `typings` field is removed.
- Calling `engine.destroy()` directly (without the factory's `destroy()`) left the play-toggle hotkey bound.
- Registered JSON and templates whose value is `0`, `''` or `false` were rejected by `getImport` and `customFunction` lookups.
- README: `createEngine` returns `localeManager` (not `languageManager`), and `KeyboardStepSource` is listed with the other position sources.
- **Test-gap pass.** Closing the second audit's 145 test gaps found nine more bugs: an Eventbus or TypedEventEmitter broadcast still called handlers an earlier handler had just removed (including `once()` handlers, which could also run twice on a re-emit); `seek()` overtaken by `switchTimeline()` emitted `seekComplete` and `time` with the previous timeline's position; `engine.destroy()` called directly on a factory-created engine left its adapters, resize listener, eventbus registrations and action lookup behind and never lowered the live-engine count; `SubtitlesController.detach` left its subtitle on screen; `setElementContent` silently ignored an unknown `insertionType`; `ConfigurationFactory.createEventAction` could not set `eventName` (now `createEventAction(name, eventName?, eventTopic?)`); and the events metadata generator merged two event interfaces with the same name instead of failing.

## 2.2.1
  - Fixed: Locale types has some circular reference warnings

## 2.2.0

### Breaking Changes

- **Complete removal of legacy label system**
  - Deleted `LanguageManager` class and `language-eventbus-adapter.ts`
  - Removed `ILanguageLabel` and related types from `src/types.ts`
  - Removed `labels` property from `IEngineConfiguration`
  - Removed `addLabel`, `removeLabel`, `editLabel` methods from `ConfigurationFactory`
  - Migration: Replace `labels` array with new `locales` configuration object (see New Features)

- **LabelController now uses `translationKey` instead of `labelId`**
  - Was: `{ labelId: 'myLabel' }` referencing `ILanguageLabel.id`
  - Now: `{ translationKey: 'nav.home' }` using dot-notation keys into locale data
  - Migration: Update all LabelController configurations to use `translationKey`

- **IEngineFactoryResult.languageManager renamed to localeManager**
  - Was: `const { languageManager } = factory.createEngine(config)`
  - Now: `const { localeManager } = factory.createEngine(config)`
  - The returned object now implements `ILocaleManager` interface

### New Features

- **Rosetta-based Locale System**
  - New `LocaleManager` class wrapping the rosetta library (~300 bytes)
  - Supports nested translation keys with dot notation: `t('nav.home')`
  - Supports array key notation: `t(['nav', 'home'])`
  - Supports interpolation: `t('greeting', { name: 'John' })` → "Hello John!"
  - Function values in translations for dynamic content
  - Event-based locale switching with `on('change', handler)`

- **External Locale File Loading**
  - New `LocaleLoader` class for loading external JSON locale files
  - Uses `$ref` syntax: `{ "en-US": { "$ref": "./locales/en-US.json" } }`
  - Parallel loading with `loadAll()` method
  - URL caching to avoid redundant fetches
  - Circular reference detection with descriptive error messages

- **Inline Locale Configuration**
  - New `locales` property in engine configuration for inline translations
  - Example:
    ```json
    {
      "locales": {
        "en-US": { "nav": { "home": "Home" } },
        "nl-NL": { "nav": { "home": "Thuis" } }
      }
    }
    ```

- **Debug Mode for Missing Translations**
  - Enable with `{ debug: true }` in LocaleManager options
  - Console warnings for missing translation keys
  - Console warnings for missing interpolation variables

- **New Eventbus Events**
  - `request-translation`: Retrieve translations via eventbus
    - Usage: `eventbus.request('request-translation', 'nav.home')` → "Home"
    - Supports interpolation: `eventbus.request('request-translation', ['greeting', { name: 'John' }])`

- **LocaleEventbusAdapter**
  - Bridges LocaleManager to/from eventbus
  - Handles `language-change` event forwarding
  - Handles `request-current-language` responses
  - Updates DOM `lang` attribute on locale change
  - Validates locale availability before switching

### New Exports

- `LocaleManager` - Core locale management class
- `LocaleLoader` - External locale file loader
- `ILocaleManager` - Interface for locale manager
- `ILocaleLoader` - Interface for locale loader
- `ILocalesConfiguration` - Configuration type for locales
- `TLanguageCode` - Type for language codes (e.g., 'en-US')
- `TLocaleData` - Type for translation data structure
- `isLocaleReference` - Type guard for `$ref` references

### Schema Generation Improvements

- **Unified TypeScript-based Schema Generator**
  - New `generate-schemas.ts` tool replaces manual schema maintenance
  - Generates all schemas directly from TypeScript type definitions using `ts-json-schema-generator`
  - Configuration schema (`eligius-configuration.json`) generated from `IEngineConfiguration`
  - Operation schemas generated from `I*OperationData` interfaces (72 operations)
  - Run with `npm run generate-schema`

- **Operation Schema References**
  - Configuration schema now uses `oneOf` to reference all operation schemas
  - Enables editor autocomplete for `systemName` values
  - Provides type-specific validation for each operation's `operationData`
  - Operations stored in `jsonschema/operations/*.json`

- **Improved Schema Quality**
  - JSDoc `@type`, `@required`, `@output`, `@erased` annotations mapped to JSON Schema
  - External types (jQuery, HTMLElement, DOM types) filtered to prevent schema bloat
  - Fallback schemas generated for operations with complex generic types

## 2.1.0

### New Features

- **KeyboardStepSource Position Source**
  - New keyboard-based position source for stepping through timeline positions
  - Arrow key navigation: Left/Right to step by `stepSize` (default: 1s), Shift+Left/Right for `largeStepSize` (default: 10s)
  - Home/End keys jump to start/end of timeline
  - Three configurable vertical modes for Up/Down arrows:
    - `timeline-switch`: Emits timeline change requests for playlist navigation
    - `chapter-navigation`: Jumps between marker positions
    - `disabled`: Ignores vertical arrow keys
  - Configurable boundary behavior: wrap (default) or clamp at boundaries
  - Optional `targetElement` to scope keyboard bindings to a specific element
  - Implements `ISeekable` interface for programmatic seeking
  - New exports: `KeyboardStepSource`, `KeyboardStepSourceConfig`, `TVerticalMode`

### Schema Updates

- Updated `raf-timeline-provider-settings.json` to document KeyboardStepSource configuration options:
  - `verticalMode`, `stepSize`, `largeStepSize`, `markers`, `targetElement`, `wrapNavigation`

## 2.0.0

### Breaking Changes

- **Eventbus request pattern replaces callback pattern**
  - Operations and controllers now use synchronous `eventbus.request()` instead of `broadcast()` with callbacks
  - `EngineFactory` now registers handlers via `onRequest()` instead of `on()`
  - Affected operations: `getImport`, `getControllerInstance`, `requestAction`, `customFunction`
  - Affected controllers: `DOMEventListenerController`, `NavigationController`
  - Migration: If you have custom eventbus listeners for `request-instance`, `request-action`, or `request-function`, use `eventbus.onRequest()` and return the value directly instead of using a callback

- **EngineFactory.createEngine() return type changed**
  - Was: `IEligiusEngine` directly
  - Now: `IEngineFactoryResult` containing `{ engine, languageManager, eventbus, destroy }`
  - Migration: Change `const engine = factory.createEngine(config)` to `const { engine } = factory.createEngine(config)`

- **EligiusEngine now uses TypedEventEmitter**
  - Engine events are now subscribed via `engine.on('eventName', handler)` returning an unsubscribe function
  - Eventbus integration is handled by adapters, not the engine directly

- **LanguageManager constructor signature changed**
  - Removed `eventbus` parameter from constructor
  - Now uses `TypedEventEmitter` internally with `on()` method for event subscriptions

- **Removed devtools/diagnostics module**
  - The `@diagnostics` module has been removed entirely
  - Removed `devtools` option from `IEngineFactoryOptions`
  - Diagnostic logging removed from `Action` and `EndableAction` classes

### New Features

- **Adapter Pattern for Clean Separation**
  - New `IAdapter` interface with `connect()` and `disconnect()` methods
  - `EngineEventbusAdapter`: Bridges engine events to/from eventbus
  - `LanguageEventbusAdapter`: Bridges language manager events to/from eventbus
  - `EngineInputAdapter`: Handles external inputs (hotkeys, window resize)
  - Adapters are automatically created and connected by `EngineFactory`

- **TypedEventEmitter Utility**
  - New generic, type-safe event emitter implementation
  - Located at `src/util/typed-event-emitter.ts`
  - Features: type-safe event subscriptions, `on()`, `once()`, `off()`, `emit()`, `removeAllListeners()`
  - Error isolation: one failing handler doesn't break others

- **Pure API for Engine and LanguageManager**
  - `IEligiusEngine` now exposes clean properties: `position`, `duration`, `playState`, `currentTimelineUri`, `container`, `engineRoot`
  - `ILanguageManager` exposes: `language`, `availableLanguages`, `on()`, `setLanguage()`, `getLabelCollection()`, `getLabelCollections()`
  - Both can be used and tested without eventbus dependency

- **Fractional Timeline Position Support**
  - Timeline positions now support fractional values (e.g., `1.3`, `5.7`) for sub-second precision
  - Configure precision via `tickInterval` in `RafPositionSource` settings (e.g., `100` for 0.1s precision)
  - Actions can trigger at fractional start/end times: `{ "start": 1.3, "end": 3.7 }`
  - Engine's `position` property, `seek()` method, and `time` event all support fractional values
  - Video position source already supported fractional positions; RAF source now matches this behavior

### Improvements

- **Better Testability**: Engine and LanguageManager can now be unit tested in isolation without eventbus mocking
- **Clearer Architecture**: Separation of concerns between core logic and eventbus integration
- **Type Safety**: Improved TypeScript types throughout, especially for event handling

## 1.5.3
- Fix metadata generation for controllers
- Refactor all typescript import paths to use path aliases

## 1.5.2
- Bug fixes in VideoJsTimelineProvider
- Removed generateImporterSourceCode and subsequently remove the dependency on node libraries
- Removed a lot of unused libraries and refactored the test suite to remove even more

## 1.5.1

### Fixes
- Export the metadata types

## 1.5.0

### Improvements
- Stricter eventbus typing

### Additions
- Implement MutationObserverController

## 1.4.1

### New Operations (32 atomic operations added)
- **Form Operations**: `getFormData`, `setFormValue`, `validateForm`, `toggleFormElement`
- **Text Operations**: `getTextContent`, `formatText`, `replaceText`, `substringText`, `concatenateStrings`, `splitString`, `replaceString`
- **Storage Operations**: `saveToStorage`, `loadFromStorage`, `clearStorage`
- **Array Operations**: `filterArray`, `mapArray`, `sortArray`, `findInArray`
- **Scroll Operations**: `scrollToElement`, `scrollToPosition`, `getScrollPosition`, `isElementInViewport`
- **HTTP Operations**: `httpPost`, `httpPut`, `httpDelete`
- **Focus/Accessibility**: `setFocus`, `getFocusedElement`, `setAriaAttribute`, `announceToScreenReader`
- **Date Operations**: `formatDate`, `getCurrentTime`, `compareDate`

### Improvements
- **Code Quality**: Eliminated all lint and type errors across entire codebase
- **Type Safety**: Improved generic type handling in operation helpers
- **Standards Compliance**: Applied modern JavaScript patterns (optional chaining, `Number.isNaN`, strict equality)

## 1.4.0

### Breaking Changes
- Renamed `EventListenerController` to `DOMEventListenerController` for clarity

### Improvements
- **Performance**: Optimized timeline operations (O(n²) → O(n), recursive → iterative execution)
- **Type Safety**: Eliminated all `any` usage in core engine files
- **Code Quality**: Standardized controller event management with BaseController pattern
- **Memory Management**: Fixed memory leaks in RoutingController, added comprehensive memory leak detection tests
- **Testing**: Added performance benchmarks and memory leak detection test suites (408 tests, 90%+ coverage)

## 1.2.0

- Renamed operation context to operation scope
- Publish json schema with npm package

## 1.1.7

- Add set-variable operation and add support in the when expression to reference those variables

## 1.1.6

- Previous release was borked, this fixes it.

## 1.1.5
- Stricter typing

## 1.1.4
- Fix esm exports

## 1.1.3
- rename `startLoop` to `forEach`.
- rename `endLoop` to `endForEach`.
- add `setEngine` method to `ConfigurationFactory`.
- switch to esbuild
- Loads of documentation tweaks

## 1.1.2
- Add `SubtitleEditor` to configuration API.

## 1.1.1
- Add `label-editor` to the configuration API.
- Add `addLabels`, `removeLabel` and `editLabel` methods to `ConfigurationFactory`.
- Add `setData` operation.
- `LabelController` can now also optionally assign its label to an element attribute.
- Fix ending actions that are already active within the seek range.
- `EventListenerController`: Add entire event target to operation data instead of the `target.value`.

## 1.1.0
- Refactor of the `ITimelineProviders`. Providers no longer have access to the eventbus, all of that logic is now handled from within the `EligiusENgine`.
- Remove JWPlayer timeline provider. This was very old code, based on an old version of JWPlayer. It'll be revisited when necessary.
- Disable `MediaElementTimelineProvider` for now. There are some bugs while bundling mediaelement which needs some thorough seeing to. For now, focus lies with the `RequestAnimationFrameTimelineProvider`

## 1.0.20
- Fix `otherwise` operation properly finding its matching `endWhen` instance
- `createElement` now ignores attribute values that are undefined

## 1.0.19
- Assign parent context to each nested context.
- Fix expression typing for context values.

## 1.0.18
- Add support for nested control flow logic. I.e. Nested `for` loops, `when`/`otherwise` and a combination of these.

## 1.0.17
- Add `when`, `otherwise` and `endWhen` operations to support if/else control flows
- Add `defaultLanguage` to global data

## 1.0.16
- Add static `extend` and `extendMultiple` methods to `ConfigurationFactory`
- `ActionCreatorFactory.ActionCreator` now correctly returns an `EndableActionCreator`
- Correctly initialize `TimelineProviderSettings` in the editor
- Narrow typing in `addControllerToElement`

## 1.0.15
- Export configuration factory API

## 1.0.14
- Fix reversed execution of actions in the end phase
- Some internal refactoring, renaming and type narrowing

## 1.0.13
- Fix RAF timeline provider broadcast of position zero on the timeline
- Make all operationData properties optional for 'actions' collection in JSON schema
- Add caching of GTK and libjpg dependencies in github build and publish actions

## 1.0.12
- Add setGlobalData operation with unit tests and metadata
- property values can now also resolve to global data. I.e. the value `globaldata.foo` will be resolved from the globals.
## 1.0.11
- Extra check for controller instance serialization
  
## 1.0.10
- Don't serialize controllers in diagnostic messages.
- Several fixes in json schema generator
- Add click handler to Progressbar controller to support scrubbing

## 1.0.9
- Add invokeObjectMethod operation
- Add getQueryParams operation
- Remove propertyName operationData properties from several operations, this needlessly complicated a lot of functionality.

## 1.0.8.1
- Add null check in prepareValueForSerialization

## 1.0.8
- Eventbus registerListener, registerInterceptor and once methods now return remove functions.
- Add more typings for diagnostics
- Add agent listeners for devtools playcontrol events
- Add destroy method to LanguageManager implmentation
  
## 1.0.7.1

- Fix postMessage serializations
## 1.0.7

- try/catch postMessage calls
- Don't fully serialize jQuery objects in postmessage, simply return 'jQuery object' string instead
- Properly serialize message in Diagnostics.send instance

## 1.0.6

- Switch from mousetrap to hotkeys (mousetrap is a dead project)
- Add diagnostic messages to the engine factory and actions (Preparations for the upcoming devtools browser extension)
- Add space press binding in factory startup and clean up in destroy (Was incorrectly added at each engine creation) 
- Improve the RAF based timeline loop (Thank you Jake Archibald: https://gist.github.com/jakearchibald/cb03f15670817001b1157e62a076fe95)

## 1.0.5

- Fix import in resource importer source generator

## 1.0.4

- Add source code generator for resource importers
- Add calc and math operations
- Fix container cleanup on engine destroy
- Improve JSON schema by generating parts of it from the sources and publish it to the github pages

## 1.0.3

- Add github actions for CI and NPM publish
- Add elaborate README and typedoc github pages
- Export metadata functions
- Several bugfixes
- Move examples to separate github repository

## 1.0.2

- Fix all unit tests
- Add documentation to all operations

## 1.0.1

- Some minor bug fixes
- Add Changelog

## 1.0.0

Initial release as Eligius (used to be called Chronotrigger).
Entire Chronotrigger code base ported to Typescript.
