# Phase 0 measurements: action execution overhead

Date: 2026-11-01. Branch `feat/aot-compiler-phase-0`. Eligius 4.0.0 built from this branch.
Machine: Windows 11, Node 24.7.0, headless Chrome 156. All numbers are means from one clean run with nothing else running.

Reproduce: `npm run bench` for section 1, the scripts in [phase-0/](phase-0/) for sections 2 to 4.

## 1. Benchmark: interpreted vs direct-call ceiling vs hand-written

`src/test/bench/action-overhead.bench.ts` (vitest bench, tinybench, jsdom, imports the built `dist/`). One action with up to 13 operations: `selectElement`, `addClass`, `setData`, a `when/otherwise/endWhen` block, a `forEach` whose body runs `setOperationData` (resolving `$scope.currentItem`) and `setData` (resolving `$operationdata.label`), and `removeClass`.

- **interpreted**: the real `Action` class.
- **direct-call ceiling**: hand-written `if`/`for` that calls the same operation functions with real scope objects. This is what generated code achieves without rewriting any operation.
- **hand-written jQuery**: the same DOM and data work with no operations.

| Scenario                             | interpreted | direct-call ceiling | hand-written | interp / ceiling | interp / hand |
| ------------------------------------ | ----------- | ------------------- | ------------ | ---------------- | ------------- |
| full: 13 ops, when, forEach over 20  | 0.218 ms    | 0.167 ms            | 0.016 ms     | 1.30x            | 13x           |
| no forEach: 9 ops with when          | 0.024 ms    | 0.015 ms            | 0.011 ms     | 1.64x            | 2.2x          |
| no when: 8 ops, forEach over 20      | 0.208 ms    | 0.171 ms            | 0.011 ms     | 1.21x            | 19x           |
| large loop: 13 ops, forEach over 200 | 2.154 ms    | 1.272 ms            | 0.017 ms     | 1.69x            | 124x          |

Derived:

- One loop iteration (`setOperationData` + `setData` + loop bookkeeping) costs about 9.7 µs interpreted and about 7.6 µs in the ceiling. The two data operations themselves, with their property-chain parsing and deep copies, are most of the cost. Interpreter bookkeeping is about 2 µs per iteration.
- A loop-free 9-operation action costs 24 µs interpreted. The ceiling saves 9 µs of that.
- The ceiling never reaches 2x over the interpreter. Gate G1 criterion (b) asks for 2x; structural codegen alone does not deliver it. Only intrinsics that replace `when` parsing, property-chain resolution and the double deep copy can, and those same changes can be made inside the interpreter.

One-time configuration resolution, 10 actions x 13 operations (130 operations):

| Step                                                                        | mean     |
| --------------------------------------------------------------------------- | -------- |
| `structuredClone(config)` alone                                             | 0.244 ms |
| `ConfigurationResolver.process` (includes the clone)                        | 1.292 ms |
| direct `Action` construction from the config (what a generated module does) | 0.003 ms |

The resolver costs about 1.05 ms for 130 operations, about 8 µs per operation, once at startup.

Earlier numbers in [research.md](research.md) (583 µs vs 20 µs) came from a throwaway spec that imported `src/` through Vite's module runner, which wraps every export in a getter; they are not comparable. The bench imports `dist/` to avoid that, and `npm run bench` builds first.

## 2. Real-browser profile

`phase-0/profile-lib.js` wraps `Action.prototype._runOperations` and records wall time per start or end run. A boundary is a cluster of runs starting within 40 ms of each other. "sync" is the synchronous part of a run (everything up to the first awaited promise); nested `startAction` runs are inside their parent's sync time, so cluster sums overstate.

### Eligian tour (real presentation, 67 actions, 7 timelines)

Source: `examples/eligian-tour/tour.json` from https://github.com/rolandzwaga/eligian, driven by `switchTimeline` to every timeline and `seek` to every action start position.

| Metric                      | Value                                                         |
| --------------------------- | ------------------------------------------------------------- |
| runs (start + end)          | 276                                                           |
| boundaries                  | 39                                                            |
| median boundary sync        | 4 ms                                                          |
| worst boundary sync         | 63.5 ms (first boundary: hub render, cold)                    |
| next worst boundaries       | 25.4, 24.9, 16.8, 10.2 ms                                     |
| max runs per boundary       | 12                                                            |
| max operations per boundary | 42                                                            |
| worst single run            | `demo.start`, 3 operations, 60.9 ms; then 24.6, 23.6, 15.2 ms |

`demo` is `selectElement > addClass > animate`. Its third operation starts a jQuery animation (`opacity`, 300 ms), which forces style and layout work. Every boundary above 10 ms contains `demo.start`. The boundaries without it, including ones with 11 runs and 38 operations, stay under about 4 ms.

Interpreter share of the worst boundary: section 1 puts interpreter bookkeeping at roughly 1 µs per loop-free operation. 42 operations are about 0.05 ms of a 25 ms boundary, under 1 percent.

### Sample deck (synthetic, 2 timeline actions, 15 operations, one forEach over 3)

| Metric                                                  | Value                                |
| ------------------------------------------------------- | ------------------------------------ |
| runs                                                    | 80                                   |
| median boundary sync                                    | 0.2 ms                               |
| worst boundary sync                                     | 4 ms (first `ShowTitle.start`, cold) |
| steady state `ShowTitle.start` (9 ops)                  | 0.4 ms                               |
| steady state `RevealBullets.start` (6 ops, loop over 3) | 0.4 to 0.8 ms                        |

## 3. Bundle baseline

Vite 8 production build (esbuild minify, es2022) of a 15-operation sample deck; sizes are the JavaScript chunks only. `lottie-web` external in all builds.

| Deck                                                          | jQuery external, min | min+gzip | jQuery bundled, min | min+gzip |
| ------------------------------------------------------------- | -------------------- | -------- | ------------------- | -------- |
| (i) fluent `ConfigurationFactory` + `EligiusResourceImporter` | 218.5 KB             | 61.7 KB  | 296.9 KB            | 88.7 KB  |
| (i-b) JSON config + `EligiusResourceImporter`                 | 203.6 KB             | 58.5 KB  | 282.0 KB            | 85.5 KB  |
| (ii) JSON config + hand-written importer naming 15 exports    | 160.1 KB             | 46.5 KB  | 238.5 KB            | 73.5 KB  |

`dist/index.mjs` itself: 579 KB, 144 KB gzip, unminified.

The hand-written importer saves 15 KB gzip (25 percent). Inspecting the unminified deck (ii) bundle shows that Vite 8 (rolldown) **does** drop the operations and controllers the deck never names: `httpDelete`, `validateForm`, `loadJson`, `LottieController`, `SubtitlesController`, `ScrollPositionSource` and the `registerOperationTypes` call are all absent. The call is dead because nothing in that deck reads the lookup it fills, so the bundler removes the mutation along with it. The roadmap's claim that the side-effect import in `src/configuration/api/index.ts` blocks tree-shaking holds only for decks that import `ConfigurationFactory` or `EligiusResourceImporter` (whose `import * as ops` keeps every operation on purpose).

What remains in the 46.5 KB is the engine runtime itself, by unminified size: `EligiusEngine` 37.8 KB, `EngineFactory` 18.3 KB, `LocaleManager` 7.5 KB, `Eventbus` 6.9 KB, `LocaleLoader` 6.4 KB, `BasePositionSource` 6.4 KB, `Action` 5.6 KB, the adapters about 12 KB, and small namespace objects (`operation_exports` 2.9 KB, metadata 3.6 KB). Phase 2 therefore cannot promise much below 46 KB gzip without slimming the engine core; its realistic deliverable is a documented `createImporter` so that decks get the 25 percent without hand-writing an importer, plus a `sideEffects` declaration so other bundlers match rolldown.

## 4. Corpus scan

### Eligian tour configuration (`phase-0/config-scan.js`)

| Question                                              | Answer                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| actions                                               | 67: 46 timeline, 20 reusable, 1 event                                                         |
| operation phases (start or end lists)                 | 74; operations per phase median 8, p90 12, max 20                                             |
| unbalanced `when`/`endWhen` or `forEach`/`endForEach` | 0                                                                                             |
| `forEach` loops                                       | 1, over `$scope.variables.points`                                                             |
| `$scope.newIndex` writes                              | 0                                                                                             |
| `customFunction`                                      | 0                                                                                             |
| property chains                                       | 1 `$operationdata`, 2 `$scope`, 0 `$globaldata`                                               |
| composition                                           | 226 `requestAction` + 226 `startAction` (every timeline action delegates to reusable actions) |
| timeline actions starting at the same position        | max 2                                                                                         |

A real Eligian-produced presentation is composition-heavy and loop-free. The compiler's biggest structural win, lowering loops, has almost nothing to lower here; `startAction`/`requestAction` resolution is where a compiler would spend its effort.

### Test corpus and README (`phase-0/corpus-scan.js`, regex-based and noisy)

- 28 files in `src/test/` contain control-flow operations; all "unbalanced" hits are unit specs that exercise a single operation on purpose.
- Literal loop collections are 0 to 5 items, with outliers of 21, 40, 51 and a 20000-item stress test.
- `$scope.newIndex` is written only in `set-data.spec.ts`.
- `customFunction` appears in its own spec, the custom-registrations integration spec, the resolver spec and 3 README examples.

## 5. Reading against gate G1

- (a) "more than 4 ms in action execution at a single boundary": the tour exceeds this, but the time is jQuery animation and layout inside operations, not `Action` or the operation helpers. As written, (a) would pass G1 for the wrong reason. Proposed amendment: count only time attributable to `Action` and the operation helpers.
- (b) "direct-call ceiling at least 2x faster": not met, 1.2x to 1.7x. Reaching 2x requires intrinsics for `when`, property chains and `setOperationData`, which are exactly Phase 1's interpreter fast paths.
- (c) owner wants compiled output for another reason: open.

Phase 1 should re-run section 1 after the fast paths land and record the new ratios here.

## 6. Phase 1 results: interpreter fast paths

Measured on 2026-11-01 in one session, both builds within minutes of each other (the hand-written jQuery variant, which touches no Eligius code, stayed at 0.008 ms in both runs). Before is commit `8913c4f6`, after is the Phase 1 commit.

| Scenario | before | after | speedup | ceiling before | ceiling after |
|---|---|---|---|---|---|
| full: 13 ops, when, forEach over 20 | 0.194 ms | 0.095 ms | 2.04x | 0.130 ms | 0.063 ms |
| no forEach: 9 ops with when | 0.016 ms | 0.012 ms | 1.34x | 0.011 ms | 0.010 ms |
| no when: 8 ops, forEach over 20 | 0.178 ms | 0.092 ms | 1.94x | 0.124 ms | 0.062 ms |
| large loop: 13 ops, forEach over 200 | 1.576 ms | 0.794 ms | 1.99x | 1.128 ms | 0.508 ms |

What changed: parsed property chains, `when` expressions and `setData` targets are cached; `deepCopy` assigns keys instead of defining them and creates its cycle map lazily; the block scans share one allocation-free implementation. The copy-on-write in `resolvePropertyValues` (decision 8) was not shipped: sharing the configured `properties` object with the result is observable by anything that holds an earlier bag, so equivalence could not be proven. The faster `deepCopy` recovers most of that gain exactly.

Attribution (`src/test/bench/action-pieces.bench.ts`, after):

| Piece | cost |
|---|---|
| dispatch of one operation with primitive configured data | 0.07 µs |
| dispatch of one operation with nested configured data (includes `deepCopy`) | 0.27 µs (was 0.73 µs) |
| one `forEach` iteration with two no-op operations (loop bookkeeping) | 0.9 µs |
| `setOperationData` resolving `$scope.currentItem` | 0.7 µs (was 1.1 µs) |
| `setData` resolving `$operationdata.label` | 0.6 µs |

The loop bookkeeping is now the largest remaining interpreter cost. It comes from `delete` on scope fields (`newIndex`, `currentItem`, the loop fields) on every iteration, which changes the scope object's shape, and from the child scope's getter and setter for `currentIndex`. Removing the deletes is observable (`findDeclaringScope` uses `in`), so it is not a Phase 1 change.

Reading against gate G1 after Phase 1: the ceiling over the interpreter is 1.5x on the loop scenarios (0.063 vs 0.095 ms, 0.508 vs 0.794 ms) and 1.2x without a loop. Criterion (b) is still not met.

## 7. Phase 2 results: `createImporter`, `eligius/runtime`, `sideEffects`

Scripts: `phase-2/measure.mjs` (installs the built package into a throwaway consumer directory, so `exports` and `sideEffects` apply as they do for a real consumer) and `phase-2/run-in-jsdom.mjs`. Results: `phase-2/sizes-no-sideeffects.result.json` and `phase-2/sizes-sideeffects.result.json`. The deck is the Phase 0 sample deck (15 operations); jQuery and lottie-web external, minified, gzip level 9. Bundlers: Vite 8 (rolldown), esbuild 0.28, webpack 5.112 (production, terser).

### Sizes, min+gzip

| Deck | rolldown, no `sideEffects` | rolldown, `false` | esbuild, no | esbuild, `false` | webpack, no | webpack, `false` |
| --- | --- | --- | --- | --- | --- | --- |
| JSON config + `EligiusResourceImporter` from `eligius` | 59.2 KB | 59.2 KB | 60.0 KB | 60.0 KB | 58.9 KB | 58.9 KB |
| JSON config + `createImporter` from `eligius` | 47.7 KB | **28.1 KB** | 49.0 KB | 49.0 KB | 48.1 KB | **28.3 KB** |
| JSON config + `createImporter` from `eligius/runtime` | **28.1 KB** | **28.1 KB** | **29.0 KB** | **29.0 KB** | **28.3 KB** | **28.3 KB** |

Reading:

- `createImporter` from the runtime entry is the floor every bundler reaches: 28 KB, 52 percent below the `EligiusResourceImporter` baseline. That is far below the 46.5 KB the Phase 0 hand-written importer reached, because that importer still loaded the main entry, whose `registerOperationTypes(operation_exports)` call and the two namespace objects of `EligiusResourceImporter` keep every operation alive once the operations sit in a shared chunk.
- `"sideEffects": false` lets rolldown and webpack reach the same floor through the main entry: `dist/index.mjs` (the fluent API, the registration call, `EligiusResourceImporter`) is skipped when nothing in it is used, and the re-exports resolve straight into the shared chunk. esbuild does not do that re-export redirection, so the main entry stays at 49 KB there. The README therefore recommends `eligius/runtime`.
- The declaration is safe for the fluent API: a deck that uses `ConfigurationFactory` and `addStartOperationByType(selectElement, ...)` through `eligius` still produces `['selectElement']` under all three bundlers (`checks` in `sizes-sideeffects.result.json`). The registration lives in `dist/index.mjs`, which is included whole as soon as `ConfigurationFactory` is used.
- The Phase 0 baseline of 58.5 KB was measured with a Vite alias straight at `dist/index.mjs`; through `node_modules` it is 59.2 KB. The difference is the chunked layout of the new two-entry build (a 4.7 KB `runtime.mjs`, a 67 KB `index.mjs` and one shared chunk).

### Build layout

`index` and `runtime` are one tsdown build, so every module exists once: `dist/index.mjs` 67.5 KB, `dist/runtime.mjs` 4.7 KB (re-exports only), one shared chunk of 527 KB (unminified). `src/test/published/shared-singletons.spec.ts` (`npm run test:published`) asserts that every export of `eligius/runtime` is the very same object as the export of `eligius`, and that only the fluent API and `EligiusResourceImporter` are missing from the runtime entry. `npm run check:types` has a runtime consumer scenario for NodeNext, Bundler and Node10 resolution.

### Exit criteria

- Sample deck min+gzip measurably smaller than the Phase 0 baseline: 59.2 KB to 28.1 KB, in the CHANGELOG.
- `eligius` and `eligius/runtime` share one globals store: tested.
- `npm run build` and `npm run check:types` pass.
- The fallback (lazy registration for `...ByType`) is not needed.

## 8. Phase 3 results: `eligius/lint` and resolver structural warnings

Date: 2026-11-01. Branch feat/aot-compiler-phase-0, on top of the Phase 2 commit.

| Exit criterion (roadmap section 9, Phase 3) | Result |
|---|---|
| Seeded-error corpus of 40 configurations produces the expected codes and JSON paths | 41 of 41 (`src/test/unit/lint/seeded-corpus.spec.ts`): 20 resolver errors (E001), 5 E101, 3 E111/W111, 1 E120, 2 E130/E131, 3 E140, 1 E141, 1 E160, 1 E310, 1 W110, 1 W150, 1 W151, 1 W160 |
| Resolver errors identical to the runtime's for 30 invalid configurations | 36 of 36 (`src/test/unit/lint/resolver-parity.spec.ts`): the E001 message equals the message `ConfigurationResolver` throws with `EligiusResourceImporter`, and the extracted path occurs in it |
| Lint loads in plain Node with jquery and lottie-web mocked to throw | `src/test/unit/lint/node-environment.spec.ts` (source) and `src/test/published/lint-entry.spec.ts` (built `dist/lint.mjs`, `npm run test:published`) |
| Published declarations | `npm run check:types` scenario "lint, no jquery, no lottie-web" under NodeNext, Bundler and Node10 |

`dist/lint.mjs` is 163 KB (41 KB gzip): the resolver, the action classes it constructs, the chain and expression helpers, and the generated operation and controller metadata. It is a build-time tool, so size was not a goal. The bundle contains no jquery or lottie-web import (checked with a grep after the build).

The resolver structural warnings cover the fuzzer's root-scope-pop case from Phase 1 (`quirks.spec.ts`, "when / forEach / otherwise / endForEach / endWhen"): the scan reports the `otherwise` inside the `forEach`. Runtime behaviour is unchanged; the differential suite still passes.

## 9. Gate G1: build codegen or stop

Date: 2026-11-01, commit 4208bb0d (Phase 3 interpreter), same machine as sections 1 to 6, Node 24.7, headless Chrome 156. Raw outputs: `phase-0/bench-g1.output.txt`, `phase-0/profile-tour.g1.result.json`, `phase-0/profile-sample.g1.result.json`.

### Bench (`npm run bench`, `action-overhead.bench.ts`)

A fourth variant was added for criterion (b): **ceiling + intrinsics** keeps the real DOM operations and the direct-call structure, and replaces `when`, `setData` and `setOperationData` with the JavaScript a compiler could emit when it knows the chains at build time (`data.count > 2`, `data.last = data.label`, `{...data, label: scope.currentItem}`).

| Scenario | interpreted | direct-call ceiling | ceiling + intrinsics | hand-written | interp / ceiling | interp / intrinsics |
|---|---|---|---|---|---|---|
| full: 13 ops, when, forEach over 20 | 0.102 ms | 0.062 ms | 0.018 ms | 0.008 ms | 1.6x | 5.8x |
| no forEach: 9 ops with when | 0.014 ms | 0.011 ms | 0.010 ms | 0.008 ms | 1.2x | 1.4x |
| no when: 8 ops, forEach over 20 | 0.094 ms | 0.063 ms | 0.015 ms | 0.008 ms | 1.5x | 6.3x |
| large loop: 13 ops, forEach over 200 | 0.853 ms | 0.509 ms | 0.066 ms | 0.012 ms | 1.7x | 12.9x |

The interpreter and the plain ceiling are where Phase 1 left them (a first run without the new variant gave 0.092 / 0.063 / 0.088 / 0.773 ms interpreted, 0.063 / 0.010 / 0.058 / 0.502 ms ceiling; Phase 3 did not touch the interpreter). The plain ceiling still never reaches 2x. The intrinsic ceiling does, by a wide margin, on every loop scenario: almost all of the per-iteration cost is `resolvePropertyValues` (deep copy of the configured `properties`, chain resolution) inside `setOperationData` and `setData`, plus the loop bookkeeping, and the intrinsics remove all three.

### Browser profile (`phase-0/profile-cdp.mjs`, amended criterion a)

`profile-lib.js` now splits every run into `opMs` (time inside the operation functions, including their jQuery calls) and `interpMs` (time inside `Action.executeOperation` outside the operation functions: scope handling, configured-data copies, dispatch). The tour input is the local Eligian checkout at 86bb3c5 (2026-10-31), which has more timelines and actions than the copy Phase 0 downloaded, so the run and boundary counts are not comparable with section 2; the attribution is new.

| Metric | Eligian tour | Sample deck |
|---|---|---|
| runs (start + end) | 281 | 80 |
| boundaries | 75 | 80 |
| worst boundary sync | 41.8 ms (4 runs, 13 ops: `revealBlock` 34 ms, jQuery) | 2.4 ms (first `ShowTitle.start`, cold) |
| median boundary sync | 1.1 ms | 0.1 ms |
| **worst boundary interpreter time** | **0.3 ms** (2 runs, 22 ops) | **0.4 ms** (cold) |
| median boundary interpreter time | 0.0 ms | 0.0 ms |
| interpreter time, whole run | 4.3 ms | 2.9 ms |
| operation time, whole run | 412.1 ms | 10.6 ms |

In the tour the interpreter is 1 percent of the time spent in actions. Every boundary above 8 ms is `revealBlock.start` or `demo.start` (jQuery `animate` forcing style and layout); their interpreter share is 0.0 to 0.2 ms. The worst boundary by interpreter time is 0.3 ms, one tenth of the 4 ms threshold.

### Decision

| Criterion | Result |
|---|---|
| (a) more than 4 ms of Action or operation-helper time at a single boundary, or dropped frames attributable to them | **Not met.** 0.3 ms worst, 4.3 ms over the whole tour. (Unamended, the tour exceeds 4 ms at 10 boundaries, every millisecond of it inside jQuery animations; the amendment proposed in section 5 is adopted.) |
| (b) ceiling, or ceiling plus `when`/`setOperationData` intrinsics, at least 2x faster than the interpreter on the loop scenarios | **Met by the intrinsic form only**: 5.8x, 6.3x and 12.9x. The plain ceiling is 1.5x to 1.7x. |
| (c) the owner wants compiled output for another reason | Open, the owner's call. |

The gate passes formally on (b). The evidence says the gain is real in the microbenchmark and invisible in the one real presentation we have: a 13x faster loop saves microseconds at boundaries that cost tens of milliseconds in jQuery. **Recommendation: do not start Phase 4 now.** Keep the gate open and re-run this section when a presentation with data-heavy loops (hundreds of `forEach` iterations at one boundary) exists, or when the owner chooses (c).

Cheaper alternative worth measuring first, if loop cost matters: the intrinsic numbers show what skipping `resolvePropertyValues` is worth. An interpreter fast path could get part of it without a second execution path: at resolution time, mark configured `properties` whose values are all primitives or chain strings, and let `setOperationData` and `setData` resolve those by direct property reads instead of a deep copy plus a recursive walk. The loop bookkeeping (0.9 µs per iteration, `delete` on scope fields) stays, so the ceiling for that approach is roughly 2x to 3x on the loop scenarios, not 13x.
