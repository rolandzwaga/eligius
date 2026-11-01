# Critique of plan.md: consumer and release side

Reviewer stance: adversarial. Claims were checked against the working tree at HEAD `30f2ac79`, the Eligian repository at `F:\projects\eligius\eligian`, and `node_modules` (jsdom 30.1.3, typescript 5.9.3). Points that held up are not listed.

Verdict: **needs-revision** (3 must-fix).

---

## Must-fix

### M1. The final grep (T11 "done when", T12 last command) cannot pass as the plan is written

- **Claim (plan section 5, end, and T11/T12):** `git grep -n -i -E "video\.js|videojs" -- . ":!CHANGELOG.md" ":!specs/00*" ":!specs/main" ":!specs/position-source-ideas.md" ":!specs/006-native-video-source" ":!.claude"` "must find nothing outside history". T11 is done when "final grep of section 5 is clean".
- **Evidence:** three separate sources of hits.
  1. `docs/` is tracked (`git ls-files docs` lists it) and full of matches: `docs/classes/VideoPositionSource.html:14,15,17,87,280`, `docs/interfaces/VideoPositionSourceConfig.html:37`, `docs/interfaces/IPositionSourceConfig.html:21`, `docs/index.html:47,196,212`, `docs/jsonschema/eligius-configuration.json:196`, `docs/media/CHANGELOG.md:56,322`. The task forbids `npm run docs`, so nothing will regenerate them.
  2. `.specify/memory/constitution.md:69,298,347,544,550,628`. T11 edits it only "if the maintainer agrees" (open question 3). If the answer is no, the grep fails.
  3. The plan adds new "video.js" strings itself: `OPTIONS_REMOVED_MESSAGE` (3.2, "removed in 4.0.0 together with video.js"), the resolver helper JSDoc ("took video.js player options ... removed video.js"), its error message and the class `@throws` text (4.1), the schema `description` string in `generate-schemas.ts` (4.2), the README `:524` replacement ("replaces video.js with the native video element", 8.3), and the R01/V24 expected messages in the specs.
- **Why it matters:** the implementer reaches T12 with a check that is red by design, and has to choose between deleting useful migration hints from error messages and leaving the task unfinished. Either outcome is worse than fixing the check.
- **Fix:** grep for dependency usage, not for the word:
  `git grep -n -E "from 'video\.js'|import\('video\.js'\)|\"video\.js\":|vi\.mock\('video\.js'|@videojs|videojs\(" -- . ":!docs" ":!specs/00*" ":!specs/main" ":!specs/position-source-ideas.md" ":!specs/006-native-video-source" ":!.claude"`
  Then add a second, word-level grep that _lists_ the remaining mentions for review instead of requiring zero. Say what happens to the constitution either way: drop the line from the check, or make the constitution edit unconditional. Then add a release step the plan does not have: before 4.0.0 is published, someone runs `npm run docs` and commits `docs/`. `docs/jsonschema/eligius-configuration.json` is the schema published at the `$id` URL (`generate-schemas.ts:101-102`, copied by `copy-schema.js`). Until that happens, editors that validate through `$schema` keep accepting `options`, and the TypeDoc site keeps documenting the video.js player.

### M2. T7's "done when" check matches the text that T7 itself adds

- **Claim (T7):** done when `Select-String jsonschema/eligius-configuration.json -Pattern 'Video.js'` finds nothing.
- **Evidence:** section 4.2 writes `then.properties.options.description = "Removed in 4.0.0 together with video.js. ..."` into both `IPositionSourceConfig` and `Partial<IPositionSourceConfig>`. `Select-String` is case-insensitive by default, and `.` matches any character, so the pattern finds both copies.
- **Why it matters:** T7 never reaches green as specified. An implementer who "fixes" the check will usually change the description, not the check.
- **Fix:** match only the stale description, `-Pattern 'Video\.js-based' -CaseSensitive` (types.ts:149 is the only source of it). Or drop "together with video.js" from the schema description: "Removed in 4.0.0. Put 'sources' and 'poster' directly in the position source settings." is enough. The second option also takes one hit out of M1.

### M3. The CHANGELOG "Was" line gets 3.x wrong: there was no control bar

- **Claim (8.2, first breaking change, "Was"):** video.js created "a wrapper `div.video-js`, control bar, poster and spinner elements and the video.js styles".
- **Evidence:** `_createPlayer` passes `controls: false, controlBar: false` (`src/timelineproviders/position-sources/video-position-source.ts:385-387`). With `controlBar: false`, video.js does not create the ControlBar child at all. A control bar existed only if a consumer overrode it through `options`. video.js 8 also does not ship "the video.js styles" by itself: it injects only a small `vjs-styles-defaults` sizing block, and the theme CSS had to be imported by the consumer (migration step 1 already says this).
- **Why it matters:** the task treats a wrong changelog as must-fix. Readers use the "Was" line to find which CSS and DOM hooks to replace.
- **Fix:** "Was: ... created a video.js player: the `<video>` moved into a wrapper `div.video-js` (the video itself became `.vjs-tech`), with video.js UI components such as the poster image, loading spinner and a big play button hidden while controls are off, and default dimensions from video.js's injected `vjs-styles-defaults` style."

---

## Should-fix

### S1. The CHANGELOG leaves out the `playsinline` behaviour change

- **Claim:** 3.2 sets `video.playsInline = true` as new; open question 2 calls it "harmless on desktop". The CHANGELOG only shows the attribute inside the element markup.
- **Evidence:** 3.x never set `playsinline` (`_createPlayer` options, `video-position-source.ts:383-397`), and video.js's `playsinline` option defaults to off. jsdom does reflect it (`node_modules/jsdom/lib/generated/idl/HTMLVideoElement.js:236-260`), so V03 is a real test.
- **Why it matters:** on iPhone, 3.x video went fullscreen on play. In 4.0.0 it plays inline, over or under the Eligius-rendered overlays. That is a visible change for exactly the overlay use case the README advertises (`README.md:25`).
- **Fix:** add a "Changed" bullet: "The video element has `playsinline`, so iOS Safari plays inline instead of switching to fullscreen."

### S2. The migration steps leave out code that reached the video.js player directly

- **Evidence:** 3.x made a real video.js player with a predictable id (`video-<uuid>`, `video-position-source.ts:149`), so host code could reach it through `videojs.getPlayer(...)`, `videojs.players`, `.vjs-tech`, or player plugins. Separately, `options.controls: true` was the only way to get controls, and step 2 just says "delete them".
- **Fix:** add a step: "Code that used the video.js player API (`videojs.getPlayer`, plugins, `player.*` calls) should use the `HTMLVideoElement` instead: `container.querySelector('video.eligius-video')`, after the timeline's init." For controls, say plainly there is no replacement in configuration, and that host code can set `video.controls = true` on that element.

### S3. The CHANGELOG suggests the schema covers the inherited case

- **Claim (8.2, `options` bullet):** lists the resolver cases "(also an override that inherits `VideoPositionSource` from its type)", then says "The JSON schema rejects it as well".
- **Evidence:** open question 5 and the 4.2 doc comment both say the schema cannot catch the inheriting override.
- **Fix:** "The JSON schema rejects it wherever `systemName` is `VideoPositionSource`; ConfigurationResolver also catches overrides that inherit it."

### S4. Migration step 4 asks for something 3.x already required

- **Claim (8.2 step 4):** "Give every source a `type`".
- **Evidence:** `type` is already required by the 3.x TypeScript type (`video-position-source.ts` `VideoSource.type: string`) and by the schema (`jsonschema/eligius-configuration.json` `sources.items.required: ["src","type"]`).
- **Fix:** reword it as an accuracy check: "Make sure every `type` is a real MIME type the browser recognises. A source whose `type` the browser reports it cannot play is skipped without being fetched, and the next one is tried."

### S5. Audio timelines from Eligian are neither tested nor documented

- **Evidence:** Eligian maps the `audio` provider to `mediaplayer` / `VideoPositionSource` and emits `audio/*` MIME types (`eligian/packages/language/src/compiler/transformers/config-builder.ts:538-581, 588-597`). The plan, README and CHANGELOG text say "video files (MP4 or WebM)" throughout.
- **Why it matters:** the claim that the "Eligian DSL keeps working unchanged" covers audio programs too. Nothing proves that, and the docs read as if audio is unsupported.
- **Fix:** add a V04 variant with `{src: 'track.mp3', type: 'audio/mpeg'}`. Write "browser-playable media files (video or audio, for example MP4, WebM, MP3)" in `VideoPositionSourceConfig.sources`, README `:78` and the CHANGELOG.

The rest of the Eligian claim holds. Eligian emits only `{systemName: 'VideoPositionSource', selector: ''}` at type level and `{selector, sources}` per timeline (`config-builder.ts:596, 635-639`), never `options`. Cross-repo follow-ups to note (not in scope here): Eligian pins `eligius` `3.0.1` (`eligian/package.json:33`), its CLI bundler still emits `import videojs from 'video.js'` / `VideoTimelineProvider` (`packages/cli/src/bundler/runtime-bundler.ts:184-188`), and the extension depends on `video.js` 10.2.0 (`packages/extension/package.json:209`).

### S6. README still says "player" for the video element

- **Evidence:** `README.md:276`: "Video timelines share one player ... which gives that timeline its own player." The plan fixes the same wording in `types.ts:417-421` and `engine-factory.ts:672-675`, but not here.
- **Fix:** "share one video element ... its own video element".

### S7. The CHANGELOG migration snippet is fenced as `json` but contains `//` comments

- **Evidence:** the block in 8.2 step 2 has `// 3.x` and `// 4.0.0` lines inside a ` ```json ` fence. Readers copy it into JSON files.
- **Fix:** use ` ```jsonc `, or two separate fenced blocks with the labels outside them.

### S8. The T2 RED run will mostly time out

- **Evidence:** the rewritten spec drops `vi.mock('video.js')`. The old implementation then loads the real `video.js` 8.24.2 (still installed until T8) under jsdom and waits for `canplay`, which never fires, so about 70 tests each wait out the default 5 s timeout.
- **Fix:** in T2, run `npm test -- --run <spec> --testTimeout=1000 --bail=5`. T2 only needs to prove red.

### S9. On Windows, `npm ci` in T12 can fail with EPERM

- **Evidence:** `npm ci` deletes `node_modules` first. This session runs `typegraph-mcp` (a devDependency) and TSGo (`@typescript/native-preview`) out of that directory, and Windows refuses to delete open files.
- **Fix:** say in T12 that the implementer stops processes that run from `node_modules` before `npm ci`. Or rely on CI's `npm ci` (`.github/workflows/ci-build.yml`) and run `npm install` plus `npm ls video.js` locally.
