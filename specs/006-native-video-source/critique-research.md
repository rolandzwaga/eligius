# Critique of the research (research-codebase.md, research-native-video.md)

Date: 2026-11-01. Checked against the working tree, node_modules\jsdom 30.1.3, the Eligian repo at F:\projects\eligius\eligian, and a throwaway ts-json-schema-generator run (scratchpad only, no project file touched).

Verdict: needs-revision (1 must-fix, 9 should-fix). Everything else I checked held: the jsdom stubs and missing `error` property, `play()` returning `undefined`, the `<source>` error semantics, the touchpoint list (git grep finds no extra video.js hit outside the documented ones), the lock-file removal (`npm uninstall` also strips `peerDependencies` and `peerDependenciesMeta`, arborist `add-rm-pkg-deps.js`), and the claim that check-dist-types has no video.js reference.

## Must-fix

### M1. "Duplicate init ... not contract, optional guard" is wrong: the engine retries a failed init on the same instance

- Claim: research-codebase.md section 9, "Duplicate init: a second `init()` currently appends a second element and leaks the first; not contract, optional guard." Section 1 items 6, 13 and 14 describe destroy only.
- Evidence: `src\eligius-engine.ts:984-993`. `_prepareSource` adds a source to `_preparedSources` only after `init()` succeeds. The doc comment above `_prepareProvider` says "A failed init is not remembered, so the next use retries it." `src\timelineproviders\position-sources\video-position-source.ts:468-472` appends a new element on every `doInit`, and `_eventHandlers` only grows. So a video timeline whose first init failed (source 404, canplay never reached, selector missing at that moment) is re-initialised through `switchTimeline` or `start`.
- Why it matters: with video.js a retry at least built a fresh player. With the native design the retry leaves the first `<video>` and its `<source>` children in the container (a leaked download). It also leaves every listener of the first attempt registered, so a late `canplay`, `error` or `ended` from the dead element settles or drives the new attempt (`_settleInit` is shared). `_video` is overwritten, so `doDestroy` can no longer reach the first element.
- Fix: make `doInit` re-entrant. Before creating anything it tears down the previous attempt (remove its listeners, pause and clear sources, `remove()`, null the reference), and it does the same on every rejection path. Add tests: "given a failed init, when init is called again, then exactly one video element is in the container and a late canplay on the old element does not settle the new init"; "given an init that is pending, when init is called again, then ..." (decide: reject the old one with a clear message, or share it). Move this item from section 9 into the contract in section 1.

## Should-fix

### S1. Appending a DOM node through jQuery to a multi-match selector clones it

- Claim: section 6 table, "keep jQuery for the container lookup/append"; section 9 does not mention the match count.
- Evidence: `video-position-source.ts:468-472` appends an HTML string to `$(selector)`; `getContainer()` returns the whole `$(selector)`. jQuery `append(node)` clones the node for every target except the last (domManip `iNoClone`), so the live, listener-bearing element ends up in the LAST match and inert clones (which still load media) in the others. The old code also appended to every match, but video.js bound the first by id.
- Fix: append to the first match only (`$(selector).first()[0].appendChild(video)` or `$container.first().append(video)`), and add a test with a selector matching two containers (one `<video>`, in the first).

### S2. The element should be created with the container's document, not the global `document`

- Evidence: `EngineFactory` takes a `window` (CLAUDE.md "Engine lifecycle"); the research sample uses `document.createElement` (research-native section 4).
- Fix: `container.ownerDocument.createElement('video')` / `'source'`. It costs nothing and keeps iframe hosts working. Keep the constructor DOM-free as required.

### S3. Schema scope and resolver scope disagree, and the schema option the research flagged "unverified" is now verified

- Claim: research-codebase sections 3 and 4: reject only for `VideoPositionSource` in the resolver, while schema option 1 is `options?: never` on `IPositionSourceConfig`.
- Evidence: I ran ts-json-schema-generator 2.9.0 (repo version) on an interface with `options?: never` plus an index signature. Result for both `IPos` and `Partial<IPos>`: `"options": {"not": {}}`. The TypeScript spread in `setPositionSourceByName` (`{systemName, ...options}` with `Record<string, unknown>`) still type-checks with `options?: never`. So option 1 works, but it forbids `options` for EVERY position source in the schema while the resolver (as recommended) would allow it for custom sources. A custom source with `options` would then be schema-invalid but resolve fine. The `if/then` alternative (option 3) cannot work for overrides without a `systemName`, and Eligian emits exactly those: `mediaPositionSource()` in `F:\projects\eligius\eligian\packages\language\src\compiler\transformers\config-builder.ts` returns `{selector, sources}` with no `systemName`.
- Fix: pick one scope for both. Simplest and consistent: option 1 plus a resolver rejection for every position source, and state in the CHANGELOG that the `options` key is reserved/removed for all position sources and that `options?: never` is a compile-time break for TypeScript users. If a custom-source carve-out is wanted, the schema cannot express it; say so.
- Also: the research reads the index-signature doc ("Additional configuration options ... custom position source implementations", types.ts:211-214) as a license for a key named `options`; it describes extra keys in general, so the carve-out is weaker than the research suggests.

### S4. Rejection order in the resolver

- Evidence: `configuration-resolver.ts:250-258`, `:385-397`. Once the `options.sources` branch is removed, a legacy configuration with only `options.sources` hits `assertMergedProviderSettings` first and reports "Missing setting at ...sources", which sends the user the wrong way.
- Fix: run the `options` rejection before `assertMergedProviderSettings` (and before `assertProviderOverride`'s later checks), and add a test for "options.sources only" expecting the options message with the migration hint.

### S5. The schema test would be silently skipped

- Claim: section 4, "Check src/test/unit and src/tools for an existing schema spec".
- Evidence: `src\test\unit\tools\schema-tools\generate-schemas.spec.ts` exists and uses `describe.skipIf(!schemaExists)` because `jsonschema/eligius-configuration.json` is gitignored (`.gitignore:28`). A new rejection test added in the same style does not run on a clean checkout or before `npm run generate-schema`.
- Fix: extend that spec, and make the new test generate the schema itself (call `generateConfigurationSchema()` or ts-json-schema-generator in memory) or assert that the file exists in the task's verification step, so the guarantee is not conditional.

### S6. Seek-before-metadata reasoning is inaccurate, and the two research files disagree on the return value

- Claim: research-native section 4 and open question 3: before metadata "the promise would hang"; research-codebase section 1 item 7: not-initialised seek resolves `getPosition()`, research-native says resolve with the requested position.
- Evidence: per the WHATWG algorithm the stored default playback start position is applied with a real seek once metadata loads, so 'seeking'/'seeked' do fire later; the promise hangs only if the media never loads. After a successful init `readyState >= HAVE_FUTURE_DATA`, so the guard only matters after an `emptied` reset or a failed init. Separately, the seek's `error` listener is specified as a plain `video` listener; `<source>` failures do not reach it (they need the capture listener) and `video.error` stays null.
- Fix: state one return value (keep `getPosition()` to match the current contract), guard on "no video, destroyed, or `readyState === 0`", and use the same capture-phase error listener for seeks as for init.

### S7. `networkState === NETWORK_NO_SOURCE` is offered as an alternative detector in one file and rejected in the other

- Evidence: research-codebase section 9 ("check `source === lastSource` or `video.networkState === NETWORK_NO_SOURCE`") versus research-native section 1 ("not proof ... also true while waiting for more sources").
- Fix: specify only "error whose target is the last `<source>`" (optionally confirmed by networkState). Drop the OR.

### S8. `sources` entries are not validated, and the DOM property setters stringify `undefined`

- Evidence: `doInit` checks only `Array.isArray && length > 0` (`video-position-source.ts:170`). `el.src = undefined` yields the URL `.../undefined`, and `el.type = undefined` sets `type="undefined"`, which browsers treat as an unrenderable type and skip silently, so init fails with a misleading "failed to load" message. The schema requires both fields, but programmatic and JS callers bypass it.
- Fix: in `doInit` reject an entry whose `src` is not a non-empty string (name the index), and set `type` only when it is a non-empty string. Add tests.

### S9. CHANGELOG and migration content gaps

- HLS/DASH: research-native section 3 asserts only Safari plays HLS natively and marks the rest UNVERIFIED. Do not write "HLS is not supported" or "stay on 3.x for HLS" as fact; write "VideoPositionSource no longer ships an HLS/DASH player; only what the browser plays natively works". Eligian maps `.m3u8` and `.mpd` to `application/x-mpegURL` and `application/dash+xml` (`MEDIA_MIME_TYPES` in config-builder.ts), so DSL users who use them need the warning.
- Eligian also emits `audio/*` types (mp3, wav, flac, ...) through VideoPositionSource for `audio` timelines. The migration notes should state that audio files still play in the `<video>` element and that no UI or poster is shown. Add a test with an `audio/mpeg` source (nothing media-type specific may be assumed in the code).
- Options with no replacement: video.js `options` users lose `muted`, `playsinline`, `fluid`/`aspectRatio`, `techOrder`, `crossOrigin`, `controls`, `loop` and the rest. The migration must map `options.sources` to `sources`, `options.poster` to `poster`, and list what is gone. Section 9 already notes the `.video-js` wrapper and `.vjs-*` CSS loss; it must reach the changelog.
- Eligian cross-repo (outside this task, but the maintainer said the DSL must keep working): I confirmed the compiler output never contains `options` (config-builder.ts `mediaPositionSource`, `generateTimelineProviderSettings`), so the compiled JSON keeps working. However `F:\projects\eligius\eligian\packages\cli\src\bundler\runtime-bundler.ts:187` still emits `import videojs from 'video.js'` for video bundles, and `pnpm-lock.yaml` pins eligius 3.0.1 with video.js 8.24.2. Mention in the CHANGELOG or hand-off notes that Eligian bundles need that import removed once they depend on Eligius 4.
- The research's "DSL emits plain JSON systemName/selector/sources/poster" (section 3, last paragraph) had no source; it is true for selector/sources and `systemName` at type level only (override has no `systemName`, no `poster`).

### S10. README line 276 still says "its own player"

- Evidence: README.md:276 "Video timelines share one player ... gives that timeline its own player." Section 7 says the other README video words need no change; this sentence describes the removed player and should say "video element".
