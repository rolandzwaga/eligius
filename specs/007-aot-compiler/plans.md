<!-- Generated 2026-11-01 from workflow run wf_a2f5d1c2-6fd (.claude/workflows/aot-compiler-plan.js). Two Opus planners with opposite angles. -->
# AOT compiler: candidate plans

# Plan A: Eligius AOT action compiler, angle A: structural compilation with exact deopt to the interpreter

**Angle:** A: minimal and incremental. The generated modules contain only each action's control structure, as generator functions. They call the operation functions that ConfigurationResolver already produced, with the scopes the interpreter would have used. Every predicted jump is checked at runtime, and any surprise hands the run back to Action.executeOperation in the middle of the run, with an identical scope stack. There is no new type system and no re-implementation of operation semantics. The engine change is additive and small: one WeakMap lookup in Action._runOperations, one optional factory option, and one install function.

The compiler is technically possible, and nothing in the engine blocks it. The engine talks to actions only through start()/end()/active/duration (src/action/types.ts, eligius-engine.ts:1497-1509), and every run goes through one protected method, Action._runOperations (src/action/action.ts:61-88). The plan uses that seam. A DOM-free compiler (`eligius/compiler`) reads the JSON configuration and turns each start/end operation list into a generator function. In that function, when/otherwise/endWhen become labelled blocks, forEach/endForEach become a labelled while loop, and break/continue become `break label`. Each operation is still called as `ops[i].instance.call(scope, merged)` on the resolver's own IResolvedOperation array, so property chains, @erased deletes, expression evaluation, loop bookkeeping and errors run the same code as today. After every operation, the generated code checks `scope.newIndex` against the jump targets it predicted. On a match it takes the structured branch. On a mismatch (a customFunction or setData writing `$scope.newIndex`, a structure the compiler paired differently, an override of `when`) it calls `executeOperation` with the live scope stack, and the interpreter finishes the run exactly as it would have. Promise results are `yield`ed to a small driver, so a fully synchronous action still completes synchronously, which TimelineAction depends on (timeline-action.ts:92-122). The compiled module holds no configuration data and depends only on the sequence of systemNames, so editing selectors or texts in the JSON does not require a recompile. Mixed mode comes free: per action, per phase, and even in the middle of a run. Speed has to be stated honestly. The measured interpreter bookkeeping is about 0.25 us per operation and about 1.3 us per loop iteration; most of the 583 us vs 20 us gap sits inside setOperationData/setData (resolvePropertyValues, deepCopy, chain parsing) and in re-parsing the when expression. So Phase 1 buys correct infrastructure, readable stack traces, compile-time structural diagnostics and a deopt-safe path, not a large speedup. Speed comes from Phase 2 caches, which help both modes. A tree-shaken static bundle comes in Phase 3. Operation inlining stays behind a measured gate.

## Goals

- Ship a compiler whose output cannot diverge from the interpreter in observable behaviour. Every op function and data helper is reused, and every structural prediction is checked at runtime, with an exact fallback to Action.executeOperation.
- Make no breaking API change. Add only: IEngineFactoryOptions.compiledActions (optional field), exported installCompiledActions() and types, a one-line WeakMap check in Action._runOperations, a new `eligius/compiler` DOM-free entry, and a new package.json exports key. All are minor-version changes under CLAUDE.md 'Public API stability'.
- Keep exact timing semantics: fully synchronous actions finish synchronously (TimelineAction.finish via onSettled, timeline-action.ts:92-135), only real thenables cause a microtask hop (action.ts:212-235), `result ?? {}` (action.ts:237), and the same error annotation through the same withOperationContext (action.ts:265-277) with the ORIGINAL operation index, so EngineActionError messages are byte-identical.
- Mixed mode by construction: any action or phase that is not compiled, or whose signature does not match, runs interpreted. A compiled run can deopt to the interpreter in the middle of the run.
- Compiled modules are independent of configuration data. The signature is the systemName sequence only, and the runtime still reads operationData from the resolver output, so content edits (selectors, labels, durations) do not need a recompile.
- Readable stack traces: one named generator per action phase (e.g. `HighlightItems$start`), with comments carrying the JSON path and operation id, and source maps to the JSON paths in Phase 3.
- Compile-time structural diagnostics with JSON paths, for unbalanced when/forEach, stray endWhen/endForEach, duplicate otherwise, and placeholders in systemName. The interpreter tolerates these silently or crashes on them with a TypeError (action.ts:156,207).
- Make the existing test suite the differential test: a second vitest project runs action, engine and integration specs with every action auto-compiled, and asserts zero unexpected deopts.
- Phase 3: a static-presentation build. A CLI emits compiled actions plus an entry module with a minimal importer that imports only the operations, controllers and providers in use, so bundlers can drop the rest (EligiusResourceImporter's `import * as ops`, eligius-resource-importer.ts:3, prevents this today).

## Non-goals

- Replacing or forking operation semantics. No operation body, property-chain resolver, when-expression evaluator or deepCopy logic is re-implemented in generated code during Phases 1-3.
- A type system for operation data. The flowing data stays one untyped `d` bag, exactly as the interpreter has it. @dependency/@required/@erased metadata is not used for codegen.
- Removing ConfigurationResolver from the runtime path. It still runs: placeholders, validation, JSON-path errors, IResolvedOperation creation. Skipping it saves about 1.1 ms per 130 ops (benchmark) and is not worth a second implementation in angle A.
- Compiling timeline scheduling, position sources, container providers, playlists, eventbus, adapters, controllers or locale (H2).
- Standalone output without the engine runtime or the JSON configuration. The static bundle still ships the config JSON (operationData, timelines, locales) next to the compiled control structure.
- Making customFunction or `$scope.newIndex` gotos structured. They are supported through deopt, not compiled away.
- Changing EligiusEngine, TimelineAction, EndableAction, ActionRegistryEventbusListener or any operation file in Phase 1.

## Architecture

### Where it lives

| Piece | Location | Entry / build | DOM-free |
|---|---|---|---|
| Compiled-body runtime contract (types, WeakMap registry, driver) | `src/action/compiled-body.ts` (new) + about 60 lines in `src/action/action.ts` | main entry `eligius` | no (lives with Action) |
| Installer | `src/action/install-compiled-actions.ts` (new), exported from `src/action/index.ts` | main entry | no |
| Factory wiring | `src/engine-factory.ts`, a 3-line call after `resolver.process()` (currently engine-factory.ts:299-304) | main entry | no |
| Compiler | `src/compiler/` (new alias `@compiler/*`: tsconfig.json, vitest `resolve`, and the tsdown alias plugin list together, see tsdown.config.ts:87-107) | new `src/compiler.ts` -> `dist/compiler.mjs`, 4th independent build in the tsdown.config.ts array (:165-173), `exports['./compiler']` + `typesVersions` (package.json:188-212), domFreeDtsBanner | **yes**: imports nothing from `@action`, `@operation` or `@configuration/configuration-resolver` |
| CLI (Phase 3) | `src/tools/compile-cli.ts` -> `bin: eligius-compile` | tsx in dev, bundled in `dist/compiler-cli.mjs` | yes |
| Tests | `src/test/unit/compiler/*`, `src/test/unit/action/compiled-*.spec.ts`, `src/test/differential/*`, `src/test/setup-compiled.ts` | vitest second project `compiled` | n/a |

The compiler does not import the resolver or any operation. action.ts imports when.ts/for-each.ts at runtime (action.ts:4,7), and the resolver imports action.ts, so that graph is not guaranteed DOM-free. The compiler only needs systemName strings, so it hardcodes the six control-flow names in `src/compiler/control-flow-names.ts`. A unit test asserts they equal the runtime exports `whenSystemName`, `otherwiseSystemName`, `endWhenSystemName` (when.ts), `forEachSystemName`, `endForEachSystemName` (for-each.ts), plus `breakForEach`/`continueForEach`.

### How it reuses ConfigurationResolver and the metadata

- **Resolver: reused unchanged at runtime.** The compiled module contains no operation data. At install time it attaches bodies to the `startOperations`/`endOperations` arrays the resolver built (configuration-resolver.ts:707-764, 473-492). The bodies read `ops[i].operationData` (already deep-copied by the resolver at :559, placeholders already substituted at :79-95) and call `ops[i].instance` (already resolved, including custom and overridden operations). All resolver validations and error messages stay as they are.
- **Metadata: names only.** The compiler optionally imports `eligius/metadata` (DOM-free, src/metadata.ts) to warn on unknown systemNames, with a `customOperations` option mirroring ConfigurationFactory's (operation-lookup.ts:40-80). Nothing else from the metadata drives codegen.

### Pipeline stages

1. **Parse.** Input is a plain `IEngineConfiguration` object (JSON, the ConfigurationFactory output, or the Eligian IR, which is already an IEngineConfiguration: eligian `eligius-ir.ts:50-55`). Collect the action phases with stable keys that mirror the resolver's JSON paths:
   - `initActions[i]`
   - `actions[<name>]`
   - `eventActions[<name>]` (names are unique across both lists, configuration-resolver.ts:458-462)
   - `timelines[t].timelineActions[a]`

   Each phase is a `systemName[]` with its source paths and op ids.
2. **Resolve structure.** Build a block tree per phase: `Seq = (Op | When{when, then, otherwise?, else, endWhen} | Loop{forEach, body, endForEach})*`. The matching rules mirror the runtime scans: nested-aware when/endWhen (when.ts findNextFlowControlIndex), forEach/endForEach via the findMatchingOperationIndex counting (for-each.ts findEndForEachIndex). The rules are only a prediction, because the runtime guards re-verify every jump.

   The phase is **not compiled** (it stays interpreted, with a diagnostic) when it has:
   - a when without endWhen, or an endWhen with no open when (the interpreter pops the root and crashes, action.ts:156,207)
   - a forEach without endForEach, or a stray endForEach
   - two otherwise at the same depth
   - crossing when/forEach blocks
   - a systemName or action name starting with `template:`, `json:` or `config:` (placeholders are substituted in every string, configuration-resolver.ts:775-865)

   A stray `otherwise` is compiled as a plain op, because the interpreter treats it as a no-op unless whenEvaluation is set, and the guard covers that case.
3. **Analyse.** Compute:
   - the signature: the systemNames joined by `,`
   - per guard point, the set of valid jump targets: the enclosing when's otherwise index (only inside its then-part) and endWhen index; the innermost loop's endForEach index and forEach index (loop restart)
   - whether the phase has zero ops (no body: EndableAction.end short-circuits, endable-action.ts:27-29)
4. **Lower and emit.** One `function*` per phase, with labelled blocks and per-op guards (see compilation_model). Plus a default-export module object `{format: 1, compiler: '<version>', actions: {key: {name, start?: {signature, body}, end?: {signature, body}}}}`. Output is ESM JavaScript plus a one-line `.d.ts`. Phase 3 adds a source map from generated lines to `<path>.startOperations[i]`.
5. **Report.** A list of `{path, kind: 'compiled' | 'interpreted', reason?}` returned by `compileConfiguration()` and printed by the CLI. `--strict` turns every 'interpreted' into an error.

### Runtime flow

1. `new EngineFactory(importer, window, {compiledActions})`, then `createEngine(config)`.
2. The resolver runs as today and returns `[actionLookup, resolved]`.
3. `installCompiledActions(compiledActions, config, resolved, actionLookup)` walks the four action groups. For each phase whose signature matches the resolved op list, it does `compiledBodies.set(action.startOperations, body)`.
4. The engine is constructed as today.
5. On every `action.start()`/`end()`, the existing `_runOperations` (and TimelineAction's override that wraps it, timeline-action.ts:124-135) creates the scope stack. It then calls the compiled driver instead of `executeOperation` when the WeakMap has an entry for that array.

Bodies are stateless functions, so one compiled module serves any number of engines and factories. Per-engine state stays in the resolver-created instances.

## Compilation model

### Source action (house style, timeline action `timelines[0].timelineActions[3]`)

```json
{
  "id": "a3",
  "name": "HighlightItems",
  "duration": {"start": 2, "end": 8},
  "startOperations": [
    {"id": "o0",  "systemName": "selectElement", "operationData": {"selector": "#list"}},
    {"id": "o1",  "systemName": "addClass", "operationData": {"className": "active"}},
    {"id": "o2",  "systemName": "when", "operationData": {"expression": "$globaldata.mode == 'compact'"}},
    {"id": "o3",  "systemName": "addClass", "operationData": {"className": "compact"}},
    {"id": "o4",  "systemName": "otherwise"},
    {"id": "o5",  "systemName": "removeClass", "operationData": {"className": "compact"}},
    {"id": "o6",  "systemName": "endWhen"},
    {"id": "o7",  "systemName": "forEach", "operationData": {"collection": "$globaldata.items"}},
    {"id": "o8",  "systemName": "when", "operationData": {"expression": "$scope.currentItem.hidden"}},
    {"id": "o9",  "systemName": "continueForEach"},
    {"id": "o10", "systemName": "endWhen"},
    {"id": "o11", "systemName": "createElement", "operationData": {"elementName": "li", "text": "$scope.currentItem.label"}},
    {"id": "o12", "systemName": "setElementContent", "operationData": {"insertionType": "append"}},
    {"id": "o13", "systemName": "wait", "operationData": {"milliseconds": 50}},
    {"id": "o14", "systemName": "endForEach"}
  ],
  "endOperations": [
    {"id": "o15", "systemName": "selectElement", "operationData": {"selector": "#list"}},
    {"id": "o16", "systemName": "removeClass", "operationData": {"className": "active"}}
  ]
}
```

### Exact emitted code

```js
// Generated by eligius-compile 4.1.0. Do not edit.
// Signature-only: operation data is read from the resolved configuration at runtime.

/** @type {import('eligius').ICompiledActionModule} */
export default {
  format: 1,
  compiler: '4.1.0',
  actions: {
    'timelines[0].timelineActions[3]': {
      name: 'HighlightItems',
      start: {
        signature: 'selectElement,addClass,when,addClass,otherwise,removeClass,endWhen,forEach,when,continueForEach,endWhen,createElement,setElementContent,wait,endForEach',
        body: HighlightItems$start,
      },
      end: {signature: 'selectElement,removeClass', body: HighlightItems$end},
    },
  },
};

// timelines[0].timelineActions[3].startOperations
function* HighlightItems$start(c, d) {
  let r;
  const s0 = c.root;
  // [0] selectElement (o0)
  r = c.run(0, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(1, d);
  // [1] addClass (o1)
  r = c.run(1, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(2, d);
  // [2..6] when / otherwise / endWhen
  const s1 = c.push(s0);
  w2: {
    o2: {
      // [2] when (o2)
      r = c.run(2, s1, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s1.newIndex !== undefined) {
        if (s1.newIndex === 4) { delete s1.newIndex; break o2; }
        if (s1.newIndex === 6) { delete s1.newIndex; break w2; }
        return c.deopt(3, d);
      }
      // [3] addClass (o3)
      r = c.run(3, s1, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s1.newIndex !== undefined) {
        if (s1.newIndex === 4) { delete s1.newIndex; break o2; }
        if (s1.newIndex === 6) { delete s1.newIndex; break w2; }
        return c.deopt(4, d);
      }
    }
    // [4] otherwise (o4): jumps to endWhen when the condition was true
    r = c.run(4, s1, d); d = (c.p(r) ? yield r : r) ?? {};
    if (s1.newIndex !== undefined) {
      if (s1.newIndex === 6) { delete s1.newIndex; break w2; }
      return c.deopt(5, d);
    }
    // [5] removeClass (o5)
    r = c.run(5, s1, d); d = (c.p(r) ? yield r : r) ?? {};
    if (s1.newIndex !== undefined) {
      if (s1.newIndex === 6) { delete s1.newIndex; break w2; }
      return c.deopt(6, d);
    }
  }
  // [6] endWhen (o6): pops the when scope, like action.ts:202-208
  r = c.run(6, s1, d); c.pop(); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(7, d);
  // [7..14] forEach / endForEach
  const s2 = c.loop(s0, 7); // push + owner = ops[7] + copy configured data once (action.ts:188-195)
  l7: while (true) {
    e7: {
      // [7] forEach (o7): resolves and snapshots the collection on the first pass, sets currentItem
      r = c.iter(7, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 14) { delete s2.newIndex; break e7; }
        if (s2.newIndex === 7) { delete s2.newIndex; continue l7; }
        return c.deopt(8, d);
      }
      // [8..10] when / endWhen
      const s3 = c.push(s2);
      w8: {
        // [8] when (o8)
        r = c.run(8, s3, d); d = (c.p(r) ? yield r : r) ?? {};
        if (s3.newIndex !== undefined) {
          if (s3.newIndex === 10) { delete s3.newIndex; break w8; }
          return c.deopt(9, d);
        }
        // [9] continueForEach (o9): records a pending jump and targets endWhen (loop-jump.ts)
        r = c.run(9, s3, d); d = (c.p(r) ? yield r : r) ?? {};
        if (s3.newIndex !== undefined) {
          if (s3.newIndex === 10) { delete s3.newIndex; break w8; }
          return c.deopt(10, d);
        }
      }
      // [10] endWhen (o10): forwards a pending continue to the loop scope
      r = c.run(10, s3, d); c.pop(); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 14) { delete s2.newIndex; break e7; }
        if (s2.newIndex === 7) { delete s2.newIndex; continue l7; }
        return c.deopt(11, d);
      }
      // [11] createElement (o11)
      r = c.run(11, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 14) { delete s2.newIndex; break e7; }
        if (s2.newIndex === 7) { delete s2.newIndex; continue l7; }
        return c.deopt(12, d);
      }
      // [12] setElementContent (o12)
      r = c.run(12, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 14) { delete s2.newIndex; break e7; }
        if (s2.newIndex === 7) { delete s2.newIndex; continue l7; }
        return c.deopt(13, d);
      }
      // [13] wait (o13): returns a promise, the driver resumes after it
      r = c.run(13, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 14) { delete s2.newIndex; break e7; }
        if (s2.newIndex === 7) { delete s2.newIndex; continue l7; }
        return c.deopt(14, d);
      }
    }
    // [14] endForEach (o14)
    r = c.run(14, s2, d);
    if (s2.newIndex === undefined) { c.pop(); d = (c.p(r) ? yield r : r) ?? {}; break l7; }
    d = (c.p(r) ? yield r : r) ?? {};
    if (s2.newIndex === 7) { delete s2.newIndex; continue l7; }
    return c.deopt(15, d);
  }
  if (s0.newIndex !== undefined) return c.deopt(15, d);
  return c.done(d);
}

// timelines[0].timelineActions[3].endOperations
function* HighlightItems$end(c, d) {
  let r;
  const s0 = c.root;
  // [0] selectElement (o15)
  r = c.run(0, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(1, d);
  // [1] removeClass (o16)
  r = c.run(1, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(2, d);
  return c.done(d);
}
```

### Why each construct is exact

- **Data flow.** `c.run(i, s, d)` sets the failing index and `root.currentIndex = i`, then does `Object.assign(d, copyConfiguredOperationData(ops[i].operationData, ops[i].systemName))` and calls `ops[i].instance.call(s, d)`. These are the same helpers and the same order as action.ts:162-200, including the proto-key check and the deep copy on every execution of nested config. The child-scope `currentIndex` setter writes through to the root (action.ts:118-120), so writing the root is equivalent. `?? {}` matches action.ts:237 and the async default at :145,149.
- **when/otherwise/endWhen.** The real `when` op parses and evaluates the expression, erases `expression` and sets `whenEvaluation`/`newIndex` (when.ts). The generated code only turns the `newIndex` it predicted (the otherwise index 4 or the endWhen index 6) into `break o2` / `break w2`. The false branch lands on `otherwise`, which still executes, as in the interpreter. The true branch reaches `otherwise`, which jumps to endWhen. The pop after endWhen happens before the promise check, as in action.ts:202-208.
- **forEach.** `c.loop` mirrors the first-iteration push, `owner`, and `_loopOperationData.set` (action.ts:188-195). `c.iter` re-merges the cached copy on every pass (action.ts:172-180), so `collection` is re-added each iteration. The real forEach/endForEach ops keep `loopIndex`, `loopLength` (last index), `currentItem` and the snapshot. An empty collection makes forEach set newIndex=14, which becomes `break e7`; endForEach then runs and pops, as in the interpreter.
- **break/continue inside a when.** loop-jump.ts sets the when scope's newIndex to the enclosing endWhen (`break w8`). After endWhen forwards the pending jump, the loop scope's newIndex=14 becomes `break e7`. For a break, the loop fields are already deleted, so endForEach pops. For a continue, endForEach advances.
- **Erased properties and property chains.** Both are handled inside the operations, untouched. createElement still resolves `$scope.currentItem.label` against `s2`, through the same resolveExternalPropertyChain, scope walk and guards (H3).
- **Async operations.** `wait` returns a Promise, so `yield r` hands it to the driver, which resumes in `.then`. That is the same single microtask hop as action.ts:219-233. The synchronous prefix (ops 0..12 of the first iteration) runs inside the Promise executor, as today.
- **Unknown jumps.** A customFunction writing `this.newIndex = 0`, a setData on `$scope.newIndex` (set-data.ts:34-37), or an override of `when` with different targets hits `return c.deopt(next, d)`. newIndex stays on the top scope, and `executeOperation(ops, next, resolve, reject, d, stack)` consumes it at action.ts:157-160 and continues with the identical stack.

### startAction and event actions

```json
"eventActions": [{
  "name": "OnLanguageChange", "eventName": "language-change",
  "startOperations": [
    {"id": "e0", "systemName": "requestAction", "operationData": {"systemName": "RefreshLabels"}},
    {"id": "e1", "systemName": "startAction", "operationData": {"actionOperationData": {"source": "event"}}}
  ]
}]
```

```js
    'eventActions[OnLanguageChange]': {
      name: 'OnLanguageChange',
      start: {signature: 'requestAction,startAction', body: OnLanguageChange$start},
    },

// eventActions[0].startOperations; d arrives as {eventArgs: [...]} (actionregistry-eventbus-listener.ts:50)
function* OnLanguageChange$start(c, d) {
  let r;
  const s0 = c.root;
  // [0] requestAction (e0): eventbus 'request-action' lookup by name, unchanged
  r = c.run(0, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(1, d);
  // [1] startAction (e1): always a promise; the callee runs its own compiled or interpreted body
  r = c.run(1, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(2, d);
  return c.done(d);
}
```

startAction/endAction need no special lowering. They call `actionInstance.start(merged)`, which goes through the callee's own `_runOperations`, so a compiled caller can start an interpreted callee and the other way round. TimelineAction active/queue semantics are untouched. Init actions and plain `actions[...]` compile the same way. An empty endOperations list emits no end body, so the EndableAction short-circuit stays in force.

## Runtime contract

### New runtime contract (`src/action/compiled-body.ts`, exported types)

```ts
export type TCompiledBody = (
  c: ICompiledContext,
  d: TOperationData
) => Generator<PromiseLike<unknown>, TCompiledExit, unknown>;

export interface ICompiledContext {
  readonly root: IOperationScope;
  p(value: unknown): value is PromiseLike<unknown>;          // isPromise (util/guards/is-promise.ts)
  run(i: number, scope: IOperationScope, d: TOperationData): unknown;
  loop(parent: IOperationScope, i: number): IOperationScope;  // push + owner + cached configured data
  iter(i: number, scope: IOperationScope, d: TOperationData): unknown; // merge cached loop data, call
  push(parent: IOperationScope): IOperationScope;
  pop(): void;
  deopt(nextIndex: number, d: TOperationData): TCompiledExit;
  done(d: TOperationData): TCompiledExit;
}
export interface ICompiledPhase { signature: string; body: TCompiledBody }
export interface ICompiledActionModule {
  format: 1;
  compiler: string;
  actions: Record<string, {name: string; start?: ICompiledPhase; end?: ICompiledPhase}>;
}
export function installCompiledBody(operations: IResolvedOperation[], body: TCompiledBody): void; // internal
```

A module-level `WeakMap<IResolvedOperation[], TCompiledBody>` is keyed by the resolver-built operation arrays. No field is added to Action, IAction or ITimelineAction.

### Engine and API changes

1. **`Action._runOperations`** (action.ts:61-88). Inside the Promise executor, choose `const body = compiledBodies.get(operations)`. If it exists, call `this._runCompiled(body, operations, wrappedResolve, wrappedReject, init, scopeStack)`; otherwise call `executeOperation` as today. The onSettled wrappers are unchanged, so TimelineAction sequencing (timeline-action.ts:97-135) keeps working: synchronous completion still calls `finish` synchronously.
2. **`Action._runCompiled`** (new private method, about 50 lines). It sits inside Action, so it can use the private `_pushScope` (:110-131), `_loopOperationData` (:27), and the module-private `copyConfiguredOperationData` (:344) and `withOperationContext` (:265). Nothing is duplicated:

```ts
private _runCompiled(body, operations, resolve, reject, init, stack) {
  const root = stack[0];
  let at = 0;
  const enter = (i: number) => { at = i; root.currentIndex = i; return operations[i]; };
  const c: ICompiledContext = {
    root, p: isPromise,
    run: (i, s, d) => { const op = enter(i); return op.instance.call(s, Object.assign(d, copyConfiguredOperationData(op.operationData, op.systemName))); },
    loop: (parent, i) => { const op = enter(i); const cfg = copyConfiguredOperationData(op.operationData, op.systemName); const s = this._pushScope(stack, parent); s.owner = op; this._loopOperationData.set(s, cfg); return s; },
    iter: (i, s, d) => { const op = enter(i); return op.instance.call(s, Object.assign(d, this._loopOperationData.get(s))); },
    push: parent => this._pushScope(stack, parent),
    pop: () => { stack.pop(); },
    deopt: (index, d) => ({deopt: true, index, d}),
    done: d => { root.currentIndex = operations.length; return {deopt: false, index: 0, d}; },
  };
  const gen = body(c, init ?? {});
  const step = (input?: unknown) => {
    let res;
    try { res = gen.next(input); }
    catch (error) { reject(withOperationContext(error, operations[at], at)); return; }
    if (!res.done) {
      const asyncAt = at;
      res.value.then(step, e => reject(withOperationContext(e, operations[asyncAt], asyncAt))).catch(reject);
      return;
    }
    const exit = res.value;
    if (exit.deopt) this.executeOperation(operations, exit.index, resolve, reject, exit.d, stack);
    else resolve(exit.d);
  };
  step();
}
```

The first `gen.next()` runs synchronously inside the Promise executor, so the timing matches action.ts:68-87. Errors get the original index, so `EngineActionError` (eligius-engine.ts:55-110) is unchanged.

3. **`installCompiledActions(module, configuration, resolved, actionLookup, {onMismatch?: 'interpret' | 'throw'})`** (new export). It checks `module.format === 1`, then walks:
   - `resolved.initActions[i]`
   - `resolved.timelines[t].timelineActions[a]`
   - `actionLookup[name]` for `actions[name]` and `eventActions[name]` (the raw `configuration.eventActions` gives the names; the instances are the ones the resolver registered on the listener, configuration-resolver.ts:162-166)

   For each entry it verifies `name` and `signature === ops.map(o => o.systemName).join(',')`. If both match, it calls `installCompiledBody`. On a mismatch the default is `console.warn` once and leave interpreted; `'throw'` fails fast naming the key. Instances that are not `Action` subclasses (a custom resolver returning duck-typed actions) are skipped with a warning.
4. **`IEngineFactoryOptions.compiledActions?: ICompiledActionModule`** and `compiledActionsMismatch?: 'interpret' | 'throw'` (optional fields, additive). In `createEngine`, right after `resolver.process(...)` (engine-factory.ts:299-304) and before provider creation: `if (this._options?.compiledActions) installCompiledActions(...)`. This also works with a custom `IConfigurationResolver`.
5. **Exports from `src/index.ts`:** the types above and `installCompiledActions`. No change to EligiusEngine, TimelineAction, EndableAction, ActionRegistryEventbusListener, request responders, the eventbus or any operation.

### Usage

```ts
import compiled from './presentation.compiled.js';
import config from './presentation.json';
const factory = new EngineFactory(new EligiusResourceImporter(), window, {compiledActions: compiled});
const {engine} = factory.createEngine(config);
```

### Mixed mode

| Granularity | How it works |
|---|---|
| Per action / per phase | A phase without a body (not compiled, structure rejected, or signature mismatch) uses `executeOperation`. Start can be compiled while end is interpreted. |
| Within a run | `deopt` hands the live scope stack, data and pending `newIndex` to the interpreter. Every built-in op, the WeakMap loop cache and pendingLoopJumps live on the same scope objects, so the interpreter continues exactly where the interpreter itself would have been. |
| Across actions | startAction/requestAction/controllers call `start()`/`end()` on instances, which pick their own body. |
| Multiple engines / shared eventbus | Bodies are pure and the state lives in the per-engine resolver instances, so it is safe. |

What does **not** mix: a compiled module from an Eligius version with a different dispatch contract. The `format` field gates this; any change to `executeOperation`'s dispatch rules bumps `format`. Custom subclasses that override `_runOperations` without calling super bypass compiled bodies, which is safe because they run as today.

## Type strategy

### Emit JS, not TS

The compiler emits ESM JavaScript plus a one-line declaration file:

```ts
declare const compiled: import('eligius').ICompiledActionModule;
export default compiled;
```

The JSDoc `@type` on the default export lets editors check the module shape. Emitting TS would add a tsc step to every consumer build and type nothing useful. The flowing data is `TOperationData = Record<string, any>` (src/operation/types.ts), and in this angle it stays one bag `d`, exactly as the interpreter has it (action.ts:181-184, 237).

### Operation data types are deliberately not tracked

Angle A does not model the chain with @dependency/@required/@erased metadata. The reasons:

- The metadata is advisory and incomplete:
  - outputProperties exist in only 37 of 79 metadata files
  - the generator never reads TOperation's output generic (metadata-generator.ts:70-88)
  - @erased is hand-written behaviour (remove-operation-properties.ts:31-39)
  - dynamic-shape ops (customFunction, setOperationData override, invokeObjectMethod, startAction) are opaque
- The design keeps every key-level effect inside the real operations, so there is nothing for the compiler to get wrong.

**Optional advisory lint (Phase 3, warnings only).** Reuse the same shallow check Eligian already has (dataflow/operation-dataflow.ts): a `dependentProperties` entry with no upstream `outputProperties` or configured key, or a missing `required` property, gives a warning with the JSON path. This never changes the generated code.

### Compile errors that become possible

These are structural and name-level only. They are warnings by default and errors under `--strict`:

| Condition | Example message |
|---|---|
| Unbalanced or crossing blocks | `timelines[0].timelineActions[3].startOperations[6]: endWhen has no matching when; action phase left interpreted (the interpreter would pop the root scope and fail with a TypeError)` |
| Missing endWhen/endForEach | Interpreter behaviour: jump to the end of the list |
| Second otherwise in one when | Reported with its JSON path |
| Placeholder prefix in a systemName or action name | Reported with its JSON path |
| Unknown systemName (optional, from `eligius/metadata` + `customOperations`) | Did-you-mean, like operation-lookup.ts |
| Duplicate keys | Same rule as configuration-resolver.ts:458-462 |
| Unknown module `format` | At install time, on the runtime side |

Everything else (bad expressions, unknown operands, forbidden chain segments, unknown action names) keeps failing at runtime with today's messages and timing, because the same operations raise it.

## Testing strategy

### 1. The existing suite becomes the differential test (main anti-drift mechanism)

- Add a second vitest project `compiled` in `src/vitest.config.ts` with `setupFiles: ['src/test/setup-compiled.ts']`.
- The setup file enables a test-only auto-compiler hook (`__setAutoCompile`, not exported from `src/index.ts`). On every `_runOperations` with an uncompiled array, the hook runs `compilePhase(ops.map(o => o.systemName))` from `@compiler`, materialises the body with `new Function` (allowed in tests only; production output is a static module), and installs it.
- The project runs the specs that exercise Action:
  - `src/test/unit/action/**` (action.spec, endable-action.spec, timeline-action.spec)
  - `src/test/unit/eligius-engine*.spec.ts`
  - `src/test/unit/engine-factory*.spec.ts`
  - all of `src/test/integration/**` (for-each-loop, when-construction, end-in-correct-order, re-use-image-action, custom-registrations, engine-smoke, ...)
- These specs then run once interpreted and once compiled, with no changes to the specs. CI runs both projects (`npm run test:ci` gains `--project unit --project compiled`).

### 2. Deopt accounting, so the safety net cannot hide compiler bugs

- `_runCompiled` increments a test-visible counter on every `deopt` and every rejected structure.
- The compiled project's `afterEach` asserts zero deopts, except in tests that opt in with `expectDeopt()`, e.g. customFunction setting `this.newIndex` or setData to `$scope.newIndex`.
- Without this, a codegen bug that always deopts would pass every test while compiling nothing.

### 3. Trace fuzzer (`src/test/differential/trace-fuzz.spec.ts`)

**Generator.** A seeded generator (a simple xorshift, no new dependency; fast-check is an open decision) builds random operation lists from:
- the real control-flow ops: when / otherwise / endWhen / forEach / endForEach / breakForEach / continueForEach, with literal expressions over `$operationdata.n` and `$scope.loopIndex`, and collections of 0-5 items, nested to depth 3
- recording ops, registered as custom operations, that log `(currentIndex, systemName, Object.keys(d), scope.loopIndex, scope.currentItem, scope.whenEvaluation)`
- chaos ops that randomly:
  - return undefined or a new object
  - return a resolved or rejected promise
  - throw a non-Error
  - set `this.newIndex` to a random index
  - set `this.whenEvaluation`
  - mutate nested configured data
- about 10% malformed lists

**Execution.** Each list runs through:
- `new TimelineAction(...).start()` then `.end()` back to back
- `new Action(...).start({eventArgs: [1]})`

once interpreted and once compiled.

**What is compared:**
- the trace
- the resolved data (deep-equal plus the key set)
- the rejection: message, `operationSystemName`, `operationIndex`, `cause`
- synchronous completion: whether `onSettled` ran before `start()` returned
- the microtask turn count at completion, measured with `queueMicrotask` markers

About 2000 cases run per CI run, with a fixed seed list plus one rotating seed whose value is logged.

### 4. Golden codegen snapshots

Use `src/test/unit/compiler/fixtures/*.json`: the benchmark action, the HighlightItems example, nested loops, break/continue through two whens, empty phases, and every rejected structure. Snapshot the generated text and the report. Snapshot changes have to be reviewed, which catches unintended output churn.

### 5. Contract tests

- Compiler control-flow names equal the runtime exports (when.ts, for-each.ts).
- `format` version: the installer rejects unknown formats.
- Installer: signature mismatch with `'interpret'` (warn, still runs) and `'throw'` (error names the key); duck-typed actions are skipped.
- Node environment for `eligius/compiler`: a copy of `src/test/unit/configuration/api/node-environment.spec.ts` that mocks jquery and lottie-web to throw.
- `npm run check:types` gets a `compiler` consumer scenario (src/tools/type-tools/check-dist-types.ts).

### 6. Benchmark as a regression test

Commit the dossier's harness as `src/test/bench/action-overhead.bench.ts`, run with `vitest bench` through a new `npm run bench`. It records four variants: interpreted, compiled, direct op calls with a real scope (the ceiling for this angle), and hand-written. Document the numbers in the spec, without a CI gate (they vary by machine).

### Keeping the two from drifting

There is only one implementation of semantics, the operations plus Action's helpers. The compiled path reuses `copyConfiguredOperationData`, `_pushScope`, `_loopOperationData` and `withOperationContext` from inside Action. What the compiler adds is a prediction of the jumps, and the runtime checks each prediction. Changing an operation never requires a compiler change. The one coupling point is the dispatch rules in `executeOperation`:
- the push for when/forEach
- the pops after endWhen and endForEach
- `newIndex` consumption
- the `?? {}` rule

Add a comment block there that points at `_runCompiled` and `format`. Add a CLAUDE.md rule: any change to `executeOperation` dispatch must update `_runCompiled`, bump `format`, and pass the compiled project.

## Phases

### Phase 0: measure the ceiling and scan the corpus (go/no-go)

Estimate: 2-3 days for one developer with an AI assistant

Deliverables:
- Commit the dossier benchmark as `npm run bench` (vitest bench) with a NEW middle variant: direct `ops[i].instance.call(scope, merged)` calls in hand-written structured control flow with real scopes. That variant is exactly what angle A emits, so it measures this angle's speed ceiling against the interpreter (583 us) and hand-written code (20 us).
- Profile split for the 13-op benchmark action: dispatch vs control-flow ops vs data ops (setOperationData/setData), vs per-execution copyConfiguredOperationData deepCopy (action.ts:352-360), vs when re-parse (when.ts:19-20).
- Corpus scan of src/test/**, the README examples and Eligian test fixtures for unbalanced blocks, `$scope.newIndex` writes and customFunction use, to estimate how often deopt or 'left interpreted' will occur.
- A one-page decision note: expected Phase 1 speed delta, and which interpreter-side caches (Phase 2) give the most.

Exit criteria: Numbers recorded for 4 variants on the benchmark action. The project owner accepts that Phase 1's speed gain is roughly the measured interpreted-vs-direct-call delta (expected 5-15% on loop-heavy actions, about 0 on DOM-bound ones), and still wants Phase 1 for its infrastructure, diagnostics, stack traces and static-bundle path. Otherwise only Phase 2 caches are done.

### Phase 1: runtime seam, compiler core, compiled test project

Estimate: 2.5 weeks for one developer with an AI assistant (runtime seam 4 days, compiler 5 days, differential harness and fuzzer 3 days, build/exports/docs 1-2 days)

Deliverables:
- src/action/compiled-body.ts: TCompiledBody, ICompiledContext, ICompiledPhase, ICompiledActionModule, the WeakMap registry, installCompiledBody.
- Action._runOperations WeakMap branch and the private Action._runCompiled driver (generator stepping, async resume, deopt to executeOperation, withOperationContext annotation).
- src/action/install-compiled-actions.ts plus IEngineFactoryOptions.compiledActions and compiledActionsMismatch, wired in EngineFactory.createEngine after resolver.process; exports from src/index.ts; TypeDoc with @example.
- src/compiler/: control-flow-names.ts, collect-phases.ts (JSON paths and keys), block-tree.ts (structure plus rejection reasons), emit.ts (labelled-block generator codegen with per-op guards), compile-configuration.ts (`compileConfiguration(config, {customOperations?, strict?}) => {code, dts, report}`), and `compilePhase(systemNames)` for the test hook.
- src/compiler.ts entry; 4th tsdown build; package.json exports './compiler' and typesVersions; new @compiler alias in tsconfig, vitest and tsdown (also fixes the missing @adapters/@locale alias entries, tsdown.config.ts:87-107, while there); node-environment spec; check-dist-types scenario.
- Vitest project `compiled` with setup-compiled.ts auto-compile hook and deopt accounting; golden codegen snapshots; trace fuzzer (about 2000 cases per run).
- CHANGELOG entry (minor), CLAUDE.md section on the dispatch-contract coupling rule.

Exit criteria: All of these hold:
- The full existing suite is green in both the `unit` and `compiled` projects, with zero unexpected deopts.
- The trace fuzzer shows no divergence in traces, data, errors (message, operationSystemName, operationIndex), sync-completion or microtask counts across the fixed seed set.
- `npm run typecheck`, `npm run check:types` and `npm run build` pass.
- The node-environment spec proves `eligius/compiler` loads without jquery or lottie-web.
- The benchmark shows compiled is no slower than interpreted.

### Phase 2: interpreter-side caches (the actual speed lever, benefits both modes)

Estimate: 1 week for one developer with an AI assistant

Deliverables:
- Memoised parseExpression in when.ts (a bounded Map keyed by the expression string, storing the parsed tree). This removes the measured 6.4-6.7 us re-parse per when execution with no semantic change, since parsing is pure.
- Per-operations-array block index cache (a WeakMap<IResolvedOperation[], Int32Array>) used by when findNextFlowControlIndex, otherwise findEndWhenIndex, forEach findEndForEachIndex and loop-jump findEnclosingEndWhenIndex. This replaces the `slice` + scan per execution (for-each.ts, otherwise.ts).
- Parsed-chain cache in getPropertyChainValue/resolveExternalPropertyChain: split segments, bracket expansion, +suffix and the forbidden-segment check memoised per chain string. The global-object guard and null-intermediate throws stay per read.
- Re-run the 4-variant benchmark and update the spec with the before/after numbers for both modes.

Exit criteria: The existing suite is green in both projects and the fuzzer is clean. The benchmark shows a measured reduction for both interpreted and compiled on the loop action (target at least 30%; the chain resolution share is about 5 us of the 9.5 us per setOperationData call). Every error message is unchanged, checked by the existing specs.

### Phase 3: static-presentation output (CLI, minimal importer, source maps, Eligian hook)

Estimate: 1.5 weeks for one developer with an AI assistant

Deliverables:
- `eligius-compile <config.json> --out dir [--entry] [--strict] [--custom-operations a,b]` bin (src/tools/compile-cli.ts -> dist/compiler-cli.mjs), printing the compiled/interpreted report with JSON paths.
- `--entry` emits entry.js. It imports only the used operations, controllers and providers by name from 'eligius', builds a minimal ISimpleResourceImporter (src/types.ts:395-409) that answers import() for the engine class, providers, used ops and controllers, and for registered functions, templates and json passed by the user. It then calls EngineFactory with compiledActions and the imported config JSON.
- Source map (v3) from generated lines to the `<path>.startOperations[i]` JSON path, so a stack frame in `HighlightItems$start` points at the config entry.
- Bundle-size measurement on a sample presentation with Vite/Rollup: EligiusResourceImporter vs the minimal importer. Decide on adding `"sideEffects"` to package.json based on the result, and verify no module relies on import-time side effects.
- Optional advisory dataflow lint (metadata dependentProperties/outputProperties/required) as warnings.
- Documentation: README 'Compiling a presentation' section, plus a note for Eligian to call `compileConfiguration` on its IR (it already emits IEngineConfiguration, eligius-ir.ts:50-55) once it moves off its eligius 4.0.0 pin.

Exit criteria: A sample presentation built with `eligius-compile --entry` runs in a browser and in the jsdom integration test with identical behaviour to the JSON path. The size report is recorded, with a measurable reduction or a documented reason. Source-mapped stack traces resolve to the right JSON path in Chrome DevTools.

### Phase 4 (optional, gated): data-specialised lowering of hot operations

Estimate: 2-3 weeks for one developer with an AI assistant, only if the gate is passed

Deliverables:
- Only if Phase 2 numbers still show a large gap on real loop-heavy presentations. An opt-in `--specialize` flag that lowers setOperationData, setData and forEach-collection reads whose configuration is fully literal into calls of extracted shared helpers (refactor the op bodies into `resolve*` functions that both the op and the generated code call, so semantics stay single-source).
- The signature extends to a hash of the operationData of specialised ops; on a mismatch the specialised body is not installed and the plain structural body is used instead.
- Fuzzer extension with chain-bearing ops and globals.

Exit criteria: At least 2x on the benchmark loop action over the Phase 2 compiled numbers, with both test projects and the fuzzer green. Otherwise the phase is dropped.

## Risks

- The speed payoff of Phase 1 is small, and the owner may expect the 27x gap. The benchmark puts interpreter bookkeeping at about 0.25 us per op and about 1.3 us per loop iteration; most of the 583 us sits inside setOperationData/setData (5-12 us per call) and in when re-parsing. Mitigations: the Phase 0 gate measures the direct-call ceiling first, Phase 2 caches deliver the speed for both modes, and the plan states the compiler's value plainly (correct infrastructure, diagnostics, stack traces, static bundle).
- Deopt hides compiler bugs: always-correct fallback means a broken codegen path would silently run interpreted. Mitigation: deopt counter asserted to zero in the compiled test project, and the install report surfaces 'left interpreted' phases.
- Touching Action._runOperations, the hottest core path. Mitigation: a single WeakMap.get per run (about 50 ns), interpreter branch unchanged, and the full suite runs in both projects.
- Hidden coupling to executeOperation's dispatch rules (push/pop by systemName, newIndex consumption, `?? {}`, the end-of-list currentIndex write). A future change there would desync _runCompiled. Mitigation: _runCompiled lives in the same class, a `format` bump rule, a CLAUDE.md rule, and the fuzzer.
- Compiled module and JSON drift apart (the user edits the structure without recompiling). The signature check catches it, but the default 'interpret' silently loses the compiled path. Mitigation: a one-time console.warn naming the key, `compiledActionsMismatch: 'throw'` for CI builds, and the CLI can verify a module against a config.
- Generated code size: about 150-250 bytes per op unminified because of per-op guards, so a 1000-op presentation adds roughly 150-250 KB before minification, which may exceed the JSON it mirrors. Mitigation: measure in Phase 3; guards minify well; an open decision on pruning guards for ops proven never to set newIndex.
- Generator overhead and debuggability: stepping through generator frames is less pleasant than plain functions, and generator allocation per run adds about 0.2-0.5 us. This is acceptable next to the measured costs, but should be re-checked in Phase 0.
- The test-only auto-compile hook uses `new Function`. It must never be reachable from production entries (CSP). Mitigation: keep it out of src/index.ts and add a test asserting it is not exported.
- Eligian pins eligius 4.0.0 and has its own bundler (runtime-bundler.ts) that emits engine plus config. Without a coordinated update, the two repos ship different static-output stories.
- The tsdown alias list is already out of sync with tsconfig (missing @adapters/@locale). Adding @compiler can surface build-resolution surprises in the new DOM-free bundle.

## Open decisions

- How compiled modules are supplied: the proposed `IEngineFactoryOptions.compiledActions` (per factory), or an optional third parameter on `createEngine(config, resolver?, {compiledActions})` (per engine). Both are additive. The factory option is simpler; per-engine fits several presentations from one factory better.
- Default mismatch policy: 'interpret' plus a one-time warning (proposed), or 'throw' (more in line with CLAUDE.md's fail-fast rule for configuration errors).
- The runtime hook: the proposed WeakMap check in Action._runOperations, or zero Action changes by subclassing Action/EndableAction/TimelineAction and overriding the public executeOperation. The subclass route would require the resolver to construct those subclasses or the installer to swap instances, which affects the listener and the lookup.
- Universal guards after every op (proposed, zero drift, larger output), or pruning guards for built-in ops proven never to write newIndex (smaller output, needs a maintained list and a test that greps for `newIndex` writes).
- Whether Phase 2's interpreter caches ship as part of this feature or as a separate performance change ahead of it. They are independent and give most of the speed.
- Add fast-check as a devDependency for the fuzzer, or keep the hand-written seeded generator.
- Whether the `eligius-compile` bin ships in the eligius package or only the programmatic `eligius/compiler` API, leaving the CLI to Eligian.
- Whether structural problems the interpreter tolerates (missing endWhen/endForEach, stray endWhen) should eventually become resolver errors with JSON paths. That would be a behaviour change and need a major version or deprecation path; the compiler already reports them.
- Versioning of the compiled `format`: tie it to the eligius minor version, or keep an independent integer that is bumped only when the dispatch contract changes (proposed).

---

# Plan B: eligius-compile: an ahead-of-time compiler from Eligius configurations to typed, tree-shaken TypeScript action modules (Angle B: complete pipeline)

**Angle:** B: ambitious and complete. A real compiler pipeline: parse with source positions, resolve by reusing the existing ConfigurationResolver, analyse (block structure, operation-data shapes, escape, scope features, async), lower to an IR, optimise (intrinsics, chain pre-parsing, copy and merge elision), and emit type-checked TypeScript or JS with source maps back to JSON paths. Each feature is checked against the code and the benchmark. Features that do not pay off are rejected explicitly: turning the operation-data bag into local variables, inlining DOM operations, statically binding requestAction, and removing unused actions.

No technical objection holds: the idea is feasible. The engine touches actions only through the duck-typed IAction/IEndableAction/ITimelineAction interface (src/action/types.ts). EngineFactory.createEngine already accepts a custom IConfigurationResolver (src/engine-factory.ts:232-304, src/types.ts:520-525). Control flow (when/otherwise/endWhen, forEach/endForEach/break/continue) is a flat list with statically known jump targets (src/operation/when.ts:110-127, src/operation/for-each.ts:114-129), so it can be rebuilt as structured if/for/labelled break and continue. eligius-compile is a DOM-free Node compiler (new `eligius/compiler` entry and an `eligius-compile` bin). It turns an IEngineConfiguration, written as JSON by hand, built with the fluent ConfigurationFactory, or produced as Eligian's IR, into a TypeScript module. That module imports only the operations, controllers and providers it uses, carries one generated run function per action phase, and plugs into the unchanged EligiusEngine through a compiled resolver. The benchmark gives the honest motivation. Absolute interpreter overhead is small: about 0.58 ms for a 13-op action with a 20-item loop, and about 60 us without the loop. Relative overhead is large: 3x without loops, 27-37x with loops. Most of it is property-chain resolution, the deepCopy in setOperationData and setData inside loops, and re-parsing `when` on every run, which is exactly what the compiler removes. The bigger user-visible wins are a tree-shaken bundle, compile-time diagnostics with JSON paths for errors that today only appear when an operation runs, `satisfies`-checked configured values, typed event arguments, and readable stack traces mapped back to the JSON. The runtime engine and the configuration format stay as they are. Each action is compiled or interpreted on its own, and the two kinds mix freely in one engine.

## Goals

- Observable equivalence with the interpreter for every action the compiler accepts: final operation data, DOM effects, eventbus traffic, the global store, error message plus operationSystemName/operationIndex, and synchronous-until-first-promise timing. A differential harness enforces this (interpreter vs compiled on every fixture plus a fuzzed corpus).
- Remove all interpretive work the benchmark attributes cost to: chain string parsing (split, toLocaleLowerCase x3, regex bracket expansion and assertSafePropertyChain per read, get-property-chain-value.ts:46-53, resolve-external-property-chain.ts:39-47), re-parsing `when` on every run (when.ts:92), flat-list scans (when.ts:110-127, for-each.ts:114-129), scope-stack push/pop and the WeakMaps (action.ts:110-131, 172-195), the per-execution deepCopy of nested configured data (action.ts:352-360), and resolvePropertyValues' deepCopy plus walk (resolve-property-values.ts:37-50) for the intrinsic data operations.
- Target performance, to be measured with a new `npm run bench`: the dossier's full 13-op/20-iteration action at 60 us or less (interpreter 583 us, handwritten 20 us), and the loop-free 9-op action at 30 us or less (interpreter 60 us, handwritten 18.5 us).
- Skip ConfigurationResolver at startup: the compiled module ships the resolved configuration as literals plus action constructors. The resolver measured about 1.1 ms per 130 operations.
- Tree-shake: the generated module imports only the operations, controllers, position sources and providers it uses, through a new minimal importer. EligiusResourceImporter's `import * as ops` (eligius-resource-importer.ts:3) keeps every built-in today.
- Compile-time diagnostics with JSON paths: unbalanced or crossing when/forEach blocks; missing @dependency inputs; missing @required parameters; literal values that violate literal unions; `when` syntax errors (the interpreter only reports these when the op runs); forbidden chain segments; `__proto__` keys; chain-looking strings in fields that are never resolved; unknown requestAction/customFunction/controller names; writes to reserved scope keys.
- Type-checked TypeScript output: each configured literal is checked with `satisfies IXOperationData['key']`; event-action eventArgs are typed from the event metadata tuples; the generated module exposes a typed host API. A JS emitter produces the same code with type annotations removed.
- Source maps (v3) from generated code back to byte offsets in the input JSON, with per-operation comments naming the JSON path, plus optional composition with Eligian's source map so stack traces land in .eligian files.
- Mixed mode: per-action fallback to the interpreter for constructs the compiler cannot structure (arbitrary `$scope.newIndex` gotos), and in a later phase a mid-run deopt from compiled code into Action.executeOperation.
- Zero breaking API changes. Every engine-side change is additive (new exports, new optional metadata fields, a new package subpath and bin), so it ships in a minor release under CLAUDE.md 'Public API stability'.
- Eligian becomes a client: it calls the compiler on its IEngineConfiguration IR and does not grow its own JS backend.

## Non-goals

- Replacing the interpreter, the JSON configuration format or the JSON schema. Runtime-loaded configurations keep working unchanged.
- Compiling timeline scheduling, position sources, container providers, playlists, the eventbus, adapters, controllers or locale handling (H2). These stay runtime classes that EngineFactory builds.
- A standalone bundle without the engine runtime. Output is 'eligius runtime plus generated action modules'.
- Turning the operation-data bag into local variables (scalar replacement). The benchmark puts merge plus scope bookkeeping at about 0.25 us per op, and several ops enumerate or retain the bag (setOperationData spreads, addControllerToElement passes it to controller.init, customFunction receives it). The gain would be noise for a large correctness risk. Generated code keeps one `d` variable that is reassigned exactly like the interpreter.
- Inlining the bodies of DOM, animation and controller operations (addClass, animate, createElement's DOM part, ...). jQuery work is the shared floor (find about 5.5 us, addClass about 1 us in the benchmark), and copies of ~70 operation bodies would drift. They stay imported functions called with a scope.
- Static binding of requestAction/startAction/customFunction/getImport targets to direct references. The eventbus request costs about 0.05 us in the benchmark, and a static binding would change behaviour on a shared eventbus, where the newest live engine answers (engine-factory.ts:188-196). The compiler only checks the names at compile time.
- Removing unused named actions. `actions` and `eventActions` are public runtime surface through request-action, which controllers (controller-actions.ts:62) and host code call by arbitrary name.
- Supporting crossing or unbalanced when/forEach structures, which the interpreter tolerates (a jump to operations.length, or a TypeError when a stray endWhen pops the root scope at action.ts:156,207). These become compile errors, with the per-action interpreter fallback as the escape hatch.
- Making every timing quirk of non-native thenables identical. Native promises are matched tick for tick; exotic thenables are documented as best effort.

## Architecture

## Where it lives

```
src/
  compiler/                     # NEW, DOM-free, Node-only (alias @compiler/* -> tsconfig.json, vitest resolve, tsdown alias plugin)
    cli.ts                      # eligius-compile bin
    index.ts                    # programmatic API: compile(input, options) -> {files, diagnostics}
    parse/json-with-offsets.ts  # tiny JSON parser keeping byte offsets per JSON path (no new dep)
    resolve/stub-importer.ts    # ISimpleResourceImporter backed by generated metadata + compile manifest
    resolve/resolve.ts          # runs the REAL ConfigurationResolver with the stub importer
    analyse/structure.ts        # flat op list -> block tree (If/Else/Loop/Break/Continue/Op), diagnostics
    analyse/shape.ts            # operation-data key lattice, escape analysis
    analyse/scope-features.ts   # decides scope mode L / S / G per run
    analyse/async.ts            # always / never / maybe per call site
    ir/                         # EIR node types + lowering
    opt/                        # intrinsics, chain pre-parse, merge/delete elision, constant folding
    emit/ts-printer.ts, emit/js-printer.ts, emit/sourcemap.ts
    diagnostics.ts              # codes, JSON path, suggestion
  compiled/                     # NEW runtime ABI, exported from the MAIN entry (one module instance, one globals store)
    compiled-action.ts          # CompiledAction / CompiledEndableAction / CompiledTimelineAction
    helpers.ts                  # readChain, readGlobalChain, loopCollection, annotate, pushScope, ...
    create-importer.ts          # minimal ISimpleResourceImporter from explicit maps (tree-shakable)
  compiler.ts                   # entry for dist/compiler.mjs (4th independent tsdown build)
```

Packaging: new `exports["./compiler"]` and `typesVersions` entry (package.json:15-38), `bin: {"eligius-compile": "dist/cli.mjs"}`, a fourth build in tsdown.config.ts, a `check-dist-types` scenario, and a node-environment spec that mocks jquery and lottie-web to throw (the pattern of src/test/unit/configuration/api/node-environment.spec.ts). Add `"sideEffects": false` to package.json after an audit (it has none today, so bundlers keep every module reachable from index.ts).

## Verified fact that shapes the design

The dossier marked this unverified. `ts_dependency_tree` shows that **src/configuration/configuration-resolver.ts (23 nodes) and src/action/action.ts (13 nodes) import no jquery**: only when.ts, for-each.ts, parse-expression.ts, parse-operand.ts, chain helpers, deep-copy, globals and guards. The compiler can therefore run the real resolver in Node, with no second implementation of placeholder resolution, duration normalisation (configuration-resolver.ts:679-705), duplicate-name checks (:458-462), provider-settings validation or did-you-mean messages. It can also reuse `parseExpression`, which already returns an AST (`TExpressionNode`, parse-expression.ts:16-25, 96).

## Pipeline

1. **Parse.** Read JSON with offsets (path -> [start, end]) for diagnostics and source maps. Inputs that are already objects (from ConfigurationFactory, or Eligian IR plus its SourceMap) carry JSON paths only.
2. **Resolve.** Deep-copy the input, because the resolver mutates it (configuration-resolver.ts:827-853). Run `new ConfigurationResolver(stubImporter, stubEventbus).process(config, capturingListener)`. The stub importer answers `import(name)` with a named stub function for every operation in `eligius/metadata`, plus manifest-declared custom operations, controllers, providers, functions, templates and json. It implements getOperationNames/getControllerNames/... so `describeNonOperation` and the did-you-mean errors behave as at runtime. The result is the action lookup, `IResolvedEngineConfiguration`, and event registrations captured from `registerAction(action, eventName, eventTopic)`. Every resolver error becomes a compile error, keeping its JSON path.
3. **Analyse**, per run (start or end of each action):
   - *Structure.* Rebuild blocks from systemName using the same depth rules as `findNextFlowControlIndex` and `findMatchingOperationIndex`. A break or continue binds to the innermost enclosing loop. Unbalanced blocks raise E101 with a JSON path.
   - *Shape.* An abstract interpretation over a key lattice (Present / Absent / Maybe, plus an `open` flag when the bag may hold unknown keys). The transfer function comes from metadata: configured keys become Present, `erased` keys become Absent, `outputProperties` become Present, and an opaque op sets `open`. It drives dependency diagnostics, elision of `delete`s, merges and re-merges, and the `override`/`properties` cleanup in intrinsics.
   - *Escape.* A boolean: has the current bag object been handed to code that may retain it (customFunction, custom operations, addControllerToElement, which calls controller.init(operationData), invokeObjectMethod)? While it has not escaped, intrinsics may update `d` in place instead of reproducing identity changes.
   - *Scope features.* Choose mode **L** (lexical: one minimal root scope, loop variables as locals), **S** (shadow: real child scope objects shaped like Action._pushScope) or **G** (an action that writes `$scope.newIndex`: interpreted, or deopt later).
   - *Async.* Classify each op from a new `@async` metadata tag: `always` (wait, startAction, endAction, loadJson, http*, animate*), `maybe` (customFunction, invokeObjectMethod, addControllerToElement, custom ops), or `never`.
4. **Lower** to EIR: `Run{blocks}`, `Merge{key, ExprLiteral|FreshLiteral}`, `Call{op, opIndex, asyncKind}`, `Intrinsic{kind,...}`, `If{cond: Expr}`, `Loop{label, collection: Expr, cfgKeys}`, `Break/Continue{label}`, `Expr` = literal | ChainRead{root: data|global|loopItem|loopIndex|loopLast|vars|scope, segs, copyLeaf} | Cmp | And | Or | Not.
5. **Optimise.** Pre-parse chains: segments, bracket expansion and the suffix split are done once and hoisted as frozen constant arrays. Forbidden segments become compile errors. Constant folding covers `when` expressions that turn constant after `config:` placeholder folding. The deepCopy on a `$globaldata` leaf is dropped where the value is only compared to a literal or tested for truthiness. Shape-proven redundant merges and deletes are removed. The intrinsic table is limited to the operations the benchmark blames: when, otherwise, endWhen, forEach, endForEach, breakForEach, continueForEach, setOperationData, setData (targets `$operationdata.*` and `$scope.variables.*` only), setVariable, and, in Phase 6, the pre-resolved core entry points of calc, math, createElement, setStyle, selectElement and broadcastEvent.
6. **Emit** TypeScript (default) or JS from the same IR, with a v3 source map (`sources: ["presentation.json"]`). Each op site carries a `// startOperations[3] forEach <- timelines[0].timelineActions[0]` comment. Named functions (`HighlightItems$start`) make stack traces readable.

## Reuse of generated metadata

`eligius/metadata` (DOM-free, src/metadata.ts) supplies operation names, `dependentProperties`, `properties` with required/erased and literal unions, `outputProperties`, and event argument tuples as TS text. New additive tags are generated by the existing ts-morph generator (src/tools/code-generator/metadata-generator.ts):

- `@resolves chain|deep|elements|expression` on properties: the per-field resolution table that today exists only as code in about 10 operations.
- `@async always|maybe`.
- `scope`, auto-derived by an AST walk of `this.` usage: none | eventbus | full.

A conformance spec fails when, for example, an op file imports `resolveExternalPropertyChain` but no property carries `@resolves`.

## Compilation model

## Input: a timeline action in the codebase's configuration style

```json
{
  "id": "a1b2c3",
  "name": "HighlightItems",
  "duration": {"start": 2, "end": 8},
  "startOperations": [
    {"id": "op0",  "systemName": "selectElement",      "operationData": {"selector": "#list"}},
    {"id": "op1",  "systemName": "addClass",           "operationData": {"className": "active"}},
    {"id": "op2",  "systemName": "when",               "operationData": {"expression": "$globaldata.mode=='full' && $operationdata.selectedElement.length>0"}},
    {"id": "op3",  "systemName": "forEach",            "operationData": {"collection": "$globaldata.items"}},
    {"id": "op4",  "systemName": "setOperationData",   "operationData": {"properties": {"label": "$scope.currentItem.title", "index": "$scope.loopIndex"}}},
    {"id": "op5",  "systemName": "when",               "operationData": {"expression": "$scope.currentItem.hidden"}},
    {"id": "op6",  "systemName": "continueForEach"},
    {"id": "op7",  "systemName": "endWhen"},
    {"id": "op8",  "systemName": "createElement",      "operationData": {"elementName": "li", "text": "$operationdata.label"}},
    {"id": "op9",  "systemName": "setElementContent",  "operationData": {"insertionType": "append"}},
    {"id": "op10", "systemName": "endForEach"},
    {"id": "op11", "systemName": "otherwise"},
    {"id": "op12", "systemName": "removeClass",        "operationData": {"className": "active"}},
    {"id": "op13", "systemName": "endWhen"},
    {"id": "op14", "systemName": "wait",               "operationData": {"milliseconds": 500}},
    {"id": "op15", "systemName": "broadcastEvent",     "operationData": {"eventName": "list-ready", "eventArgs": ["$operationdata.index"]}}
  ],
  "endOperations": [
    {"id": "op20", "systemName": "selectElement", "operationData": {"selector": "#list"}},
    {"id": "op21", "systemName": "clearElement"}
  ]
}
```

What the analyses conclude:

- **Structure.** If(2){Loop(3..10){..., If(5){Continue}}} Else(11..13).
- **Shape.** The start run begins with closed `{}`, because the engine calls `action[phase]()` with no arguments. After op0: {selectedElement}, since selector and useSelectedElementAsRoot are erased. op1 erases className. setElementContent's @dependency selectedElement is Present (it survives setOperationData's spread). op9 erases `template`, which op8 produced.
- **Escape.** None; there is no customFunction or controller.
- **Scope mode L.**
- **Async.** op14 `wait` is `always`; everything else is `never`.

## Emitted TypeScript (mode L)

```ts
// GENERATED by eligius-compile from presentation.json — do not edit.
import type {
  IAddClassOperationData, IBroadcastEventOperationData, IClearElementOperationData,
  ICreateElementOperationData, IEventbus, IRemoveClassOperationData, ISelectElementOperationData,
  ISetElementContentOperationData, IWaitOperationData, TOperationData as Bag,
} from 'eligius';
import {
  addClass, broadcastEvent, clearElement, CompiledTimelineAction, createElement, readChain,
  readGlobalChain, loopCollection, annotate, removeClass, selectElement, setElementContent, wait,
  type ICompiledRun, type ICompiledOperation,
} from 'eligius';

// Descriptors: what scope.operations[currentIndex].systemName and error annotation read
// (assert-safe-property-chain.ts getCurrentOperationName). Same indices as the JSON arrays.
const S: ICompiledOperation[] = [
  {id: 'op0', systemName: 'selectElement', operationData: {selector: '#list'}},
  /* ... op1..op15, verbatim descriptors (operationData kept for deopt/debugging) ... */
];
const E: ICompiledOperation[] = [/* op20, op21 */];

// Chains parsed at compile time: segments, bracket expansion and safety checks done once.
const G_MODE = ['mode'] as const;                       // $globaldata.mode
const C_LEN = ['selectedElement', 'length'] as const;   // $operationdata.selectedElement.length
const G_ITEMS = ['items'] as const;                     // $globaldata.items
const C_TITLE = ['currentItem', 'title'] as const;      // $scope.currentItem.title
const C_HIDDEN = ['currentItem', 'hidden'] as const;    // $scope.currentItem.hidden

const HighlightItems$start: ICompiledRun = async (scope, init, done, fail) => {
  let at = 0;
  try {
    let d: Bag = init ?? {};
    // [0] selectElement  <- timelines[0].timelineActions[0].startOperations[0]
    scope.currentIndex = 0;
    d.selector = '#list' satisfies ISelectElementOperationData['selector'];
    d = (selectElement.call(scope, d as ISelectElementOperationData) as Bag) ?? {};
    // [1] addClass
    at = 1; scope.currentIndex = 1;
    d.className = 'active' satisfies IAddClassOperationData['className'];
    d = (addClass.call(scope, d as IAddClassOperationData) as Bag) ?? {};
    // [2] when  (expression parsed at compile time; 'expression' key provably absent -> no delete)
    at = 2;
    if (
      readGlobalChain(G_MODE, 'when', /*copyLeaf*/ false) === 'full' &&   // compared to a literal: deepCopy elided
      readChain(d, C_LEN, 0, 'when') > 0
    ) {
      // [3] forEach  collection resolved once, deep-copied ($globaldata) and sliced
      at = 3;
      d.collection = '$globaldata.items';            // config merge; stays in d after the loop, as today
      const items3 = loopCollection(readGlobalChain(G_ITEMS, 'forEach', true), 'forEach');
      // body never writes 'collection' (shape) -> per-iteration re-merge elided
      L3: for (let i3 = 0; i3 < items3.length; i3++) {
        const item3 = items3[i3];
        // [4] setOperationData (intrinsic; bag not escaped -> in-place, same key order as {...rest, ...resolved})
        at = 4;
        d.label = readChain(item3, C_TITLE, 1, 'setOperationData');
        d.index = i3;                                // $scope.loopIndex
        // [5] when (bare operand -> truthiness)
        at = 5;
        if (readChain(item3, C_HIDDEN, 1, 'when')) {
          continue L3;                               // [6] continueForEach, [7] endWhen
        }
        // [8] createElement (real op: it resolves its own chains, so the raw string is passed)
        at = 8; scope.currentIndex = 8;
        d.elementName = 'li' satisfies ICreateElementOperationData<'li'>['elementName'];
        d.text = '$operationdata.label';
        d = (createElement.call(scope, d as ICreateElementOperationData<'li'>) as Bag) ?? {};
        // [9] setElementContent
        at = 9; scope.currentIndex = 9;
        d.insertionType = 'append' satisfies ISetElementContentOperationData['insertionType'];
        d = (setElementContent.call(scope, d as ISetElementContentOperationData) as Bag) ?? {};
      } // [10] endForEach
    } else { // [11] otherwise
      // [12] removeClass
      at = 12; scope.currentIndex = 12;
      d.className = 'active' satisfies IRemoveClassOperationData['className'];
      d = (removeClass.call(scope, d as IRemoveClassOperationData) as Bag) ?? {};
    } // [13] endWhen
    // [14] wait (@async always): one microtask hop, same as the interpreter's .then
    at = 14; scope.currentIndex = 14;
    d.milliseconds = 500;
    d = ((await wait.call(scope, d as IWaitOperationData)) as Bag) ?? {};
    // [15] broadcastEvent: nested config -> FRESH literal per run (== deepCopy at action.ts:359)
    at = 15; scope.currentIndex = 15;
    d.eventName = 'list-ready';
    d.eventArgs = ['$operationdata.index'];
    d = (broadcastEvent.call(scope, d as IBroadcastEventOperationData) as Bag) ?? {};
    done(d);
  } catch (e) {
    fail(annotate(e, S[at].systemName, at));      // = withOperationContext (action.ts:265-277)
  }
};

// No awaits -> plain synchronous function (no async wrapper at all)
const HighlightItems$end: ICompiledRun = (scope, init, done, fail) => {
  let at = 0;
  try {
    let d: Bag = init ?? {};
    scope.currentIndex = 0;
    d.selector = '#list';
    d = (selectElement.call(scope, d as ISelectElementOperationData) as Bag) ?? {};
    at = 1; scope.currentIndex = 1;
    d = (clearElement.call(scope, d as IClearElementOperationData) as Bag) ?? {};
    done(d);
  } catch (e) {
    fail(annotate(e, E[at].systemName, at));
  }
};

export function createActions(eventbus: IEventbus) {
  const HighlightItems = new CompiledTimelineAction(
    'HighlightItems', {start: 2, end: 8}, eventbus,
    S, HighlightItems$start, E, HighlightItems$end
  );
  HighlightItems.id = 'a1b2c3';
  return {HighlightItems};
}
//# sourceMappingURL=presentation.compiled.ts.map
```

Why this matches the interpreter step by step:

- **Merge order.** Configured keys are assigned onto the same `d` before each call (action.ts:181-184). Primitive-only configured data is never copied (action.ts:362). Nested data (`eventArgs`) is a fresh literal per run, matching the per-execution deepCopy at action.ts:359.
- **Return values.** `?? {}` is action.ts:237.
- **Sync timing.** An async arrow runs synchronously until its first `await`. The only await follows `wait`, so the action stays synchronous up to op14, as with action.ts:212-235. For the end run, `done` is called synchronously, so TimelineAction's `finish` still runs inside the same call stack (timeline-action.ts:92-122).
- **Error annotation.** `at` reproduces failingIndex and asyncIndex: a rejection of `wait` is annotated with index 14, like action.ts:230-232.
- **Error text.** `readChain(item3, C_TITLE, 1, 'setOperationData')` throws exactly `setOperationData: property chain 'currentItem.title' cannot be resolved: 'currentItem' is undefined.` and applies the global-object guard (get-property-chain-value.ts:59-86).
- **Loops.** `loopCollection` gives null to `[]`, throws the forEach message for non-arrays (for-each.ts:102-110), and returns `.slice()` (for-each.ts:53). `continue L3` is equivalent to the loop-jump hop through the intervening endWhen, because nothing observable runs in between.
- **`$scope.loopIndex`** is `i3`. A `$scope.loopLength` read would compile to `items3.length - 1` (for-each.ts:49).

## Event action (typed eventArgs, literal-field diagnostic)

```json
{"name": "OnLanguage", "eventName": "language-change", "startOperations": [
  {"id": "e0", "systemName": "selectElement",     "operationData": {"selector": "#lang"}},
  {"id": "e1", "systemName": "setElementContent", "operationData": {"template": "$operationdata.eventArgs.0"}}]}
```

The compiler emits `W205 setElementContent.template is not chain-resolved; '$operationdata.eventArgs.0' will be inserted literally (eventActions[0].startOperations[1].operationData.template)`. It still emits the literal, because that is the runtime behaviour. The run signature is `(scope, init: {eventArgs: [language: TLanguageCode]}, done, fail)`, typed from src/eventbus/events/language-change.ts. The action is a `CompiledAction` registered by the compiled resolver through `listener.registerAction(action, 'language-change', undefined)`. The listener still creates a fresh `{eventArgs: [...args]}` per event (actionregistry-eventbus-listener.ts:50).

## startAction / requestAction

```json
{"systemName": "requestAction", "operationData": {"systemName": "ShowCredits"}},
{"systemName": "startAction",   "operationData": {"actionOperationData": {"speed": 2}}}
```

```ts
at = 7; scope.currentIndex = 7;
d.systemName = 'ShowCredits';                 // compile-time check: 'ShowCredits' in actions/eventActions (E310 otherwise)
d = (requestAction.call(scope, d) as Bag) ?? {};
at = 8; scope.currentIndex = 8;
d.actionOperationData = {speed: 2};           // fresh literal per run
d = ((await startAction.call(scope, d)) as Bag) ?? {};   // @async always (start-action.ts:38)
```

The runtime lookup goes through the eventbus as before, because the shared-eventbus semantics depend on it. A compiled callee is just another IEndableAction.

## Mode S (customFunction or custom op inside a loop)

When an action contains an op with `scope: full` (customFunction, custom ops, `$scope.owner`/`whenEvaluation`/`currentIndex` chains), the emitter keeps real scope objects with the same fields the interpreter maintains:

```ts
const s3 = pushScope(scope);                   // same accessor shape as action.ts:110-131
s3.owner = S[3]; s3.loopEndIndex = 10;
const items3 = loopCollection(readChain(d, C_ROWS, 0, 'forEach'), 'forEach');
if (items3.length) { s3.loopIndex = 0; s3.loopLength = items3.length - 1; s3.loopStartIndex = 3; }
L3: for (let i3 = 0; i3 < items3.length; i3++) {
  s3.loopIndex = i3; s3.currentItem = items3[i3];
  at = 4; scope.currentIndex = 4;
  d.systemName = 'tally';
  let r: unknown = customFunction.call(s3, d);
  if (isPromise(r)) r = await r;                // @async maybe
  d = (r as Bag) ?? {};
  if (s3.newIndex !== undefined) return deopt(stack, 4, d, done, fail);  // Phase 6; before that: E402 at compile time is impossible, so a runtime error naming the action
  if (i3 < items3.length - 1) delete s3.currentItem;                     // endForEach bookkeeping
}
```

## Erased properties, specifically

- `delete` is emitted only when the shape lattice says the key may be present when the op would erase it. Real ops still do their own deletes.
- Erasures that intrinsics perform themselves (when's `expression`, setVariable's `name`/`value`, setOperationData's `properties`/`override`) collapse to nothing when the key is Absent.
- When the bag is `open` (after an opaque op) the deletes are emitted as `delete d.override`.

## Runtime contract

## What the runtime must expose (all additive, minor release)

Exported from the **main** `eligius` entry, not a separately bundled subpath. That keeps a single instance of module-level state: the globals store (globals.ts:5), the loadJson cache, and `liveEngineCount` (engine-factory.ts:62, 285-290).

1. **`CompiledAction`, `CompiledEndableAction`, `CompiledTimelineAction`.** Subclasses of Action, EndableAction and TimelineAction that take descriptor arrays plus run functions. They override the already public `executeOperation(operations, index, resolve, reject, data, scopeStack)` (action.ts:140). When `index === 0` and `operations` is one of their own descriptor arrays, they call `run(scopeStack[0], data, resolve, reject)`. Otherwise they delegate to `super.executeOperation`, which is the deopt and interpreted-continuation path.
   - Action, EndableAction and TimelineAction need **no changes**. `_runOperations` still builds the root scope `{currentIndex:-1, eventbus, operations}` (action.ts:90-100) and wires `onSettled`.
   - TimelineAction's active flag, `_sequence` queue and synchronous `finish` (timeline-action.ts:54-135) are inherited unchanged.
   - EndableAction's empty-end short-circuit (endable-action.ts:27-29) still applies.
   - A contract spec pins the internal call `_runOperations -> executeOperation(ops, 0, ...)` so that a refactor of Action cannot silently bypass compiled runs.
2. **Helpers.**
   - `readChain(root, segs, startIndex, opName)` and `readGlobalChain(segs, opName, copyLeaf)` implement the get-property-chain-value semantics without parsing: null-intermediate errors, a missing leaf returns undefined, inherited members are readable, the global-object guard, and the `+suffix` pre-split into a separate argument. The interpreter's getPropertyChainValue is refactored to call the same `walkChain` core (Phase 0), so drift is structurally impossible.
   - `loopCollection`.
   - `annotate`, which is `withOperationContext` (action.ts:265) exported under a new name.
   - `isPromise`.
   - `pushScope`, which is `_pushScope` lifted to a function.
   - `setDataWrite` for the `$globaldata`/`$operationdata` targets of setData.
   - `deepCopy`, `getGlobals`, `setGlobals`.
   - `COMPILED_ABI_VERSION`. Generated modules call `assertCompiledAbi(1)` at import time, so a module from an incompatible compiler fails with a clear message instead of misbehaving.
3. **`createImporter({operations, controllers, providers, engines, functions, templates, json})`.** A tree-shakable ISimpleResourceImporter that does exactly the name lookups the factory and the request-instance/request-function responders need (engine class, position sources, container providers, playlists, controllers for addControllerToElement, functions for customFunction/getImport). The registration rules of EligiusResourceImporter stay as they are. The new importer simply avoids `import * as ops` (eligius-resource-importer.ts:3).
4. **Phase 6.** `setLoopCollection(scope, items)` exported next to `clearLoopCollection` (for-each.ts:84), plus a `seedLoopOperationData` hook. A mid-loop deopt must register the snapshot that forEach reads on re-execution (for-each.ts:65-68), or `currentItem` stops updating.

## How compiled output plugs into EngineFactory (no factory change)

The generated module exports:

```ts
export const engineConfiguration: IEngineConfiguration = {
  id, engine: {systemName: 'EligiusEngine'}, language: 'en-US', locales: {...},
  containerSelector, layoutTemplate, timelineProviderSettings, timelines: [],
  // the factory only reads eventActions?.length to decide whether to create the listener (engine-factory.ts:296-298)
  eventActions: [{name: 'OnLanguage', eventName: 'language-change', startOperations: []}],
  initActions: [], actions: [],
};
export const importer = createImporter({engines: {EligiusEngine}, providers: {RafPositionSource, DomContainerProvider}, controllers: {LabelController}, functions: {...host}});
export function createResolver(): IConfigurationResolver {
  return {
    process(_config, listener) {
      const eventbus = /* captured below */;
      ...
    },
  };
}
export function createPresentation(windowRef: Window, options?: IEngineFactoryOptions) {
  const factory = new EngineFactory(importer, windowRef, options);
  return factory.createEngine(engineConfiguration, createResolver());
}
```

Resolver problem: `IConfigurationResolver.process` receives no eventbus, but Action captures one at construction (action.ts:29-33). There are two options:

- (a) **Additive, recommended.** Extend the interface with an optional second constructor-time hook: `createResolver(eventbus)`, and have the factory pass it through a new optional `IConfigurationResolverFactory` parameter overload. This is one optional parameter, so a minor release.
- (b) **No change.** Read the eventbus lazily: `CompiledAction` gets its eventbus from the first `request` it makes... This is rejected as fragile.

Under (a), `createEngine(config, resolverOrFactory)` accepts `resolver | ((eventbus) => resolver)`. The returned tuple is `[actionLookup, resolvedConfiguration]`, built from literals. The engine reads only containerSelector, layoutTemplate, timelines and initActions from it (eligius-engine.ts:418, 866, 891-917, 921-954). The factory builds providers from `timelineProviderSettings` plus the per-timeline overrides, which the compiler copies verbatim; the resolver already validated them at compile time. Each `createPresentation` call creates fresh action instances, because TimelineAction holds per-instance state.

## Mixed mode

Per action, the compiler emits either a compiled class or a normal Action, EndableAction or TimelineAction built from the descriptors. In that case the generated module imports the real op functions, including when/forEach/etc., and lets the interpreter run them. Both kinds go into the same lookup, and both satisfy the duck type the engine uses (`active`, `duration`, `start`/`end`, `id`, `name`; eligius-engine.ts:1497-1509, 1620-1761). They interoperate:

- startAction can call an interpreted action from a compiled one and the reverse.
- Controllers resolve either kind through request-action.
- EngineActionError reads `operationSystemName`/`operationIndex` from both (eligius-engine.ts:55-90), with the same indices.

What does **not** mix is a single run that is partly compiled and partly interpreted. The only exception is the Phase 6 deopt, which hands the reconstructed mode-S scope stack to `super.executeOperation` at `newIndex`; that works because action.ts:157-160 consumes `newIndex` at the top of the loop. Mode L runs cannot deopt, so any action that could write `newIndex` (customFunction, custom ops, setData `$scope.newIndex`) is compiled in mode S or left interpreted.

## H2 verdict, as implemented

The compiler removes the Action interpreter loop and the ConfigurationResolver from the shipped bundle. EligiusEngine scheduling, position sources, providers, the eventbus and its responders, adapters, controllers, LocaleManager and TimelineAction sequencing all run at runtime unchanged.

## Type strategy

## Emit TypeScript by default, JS on request

The default output is `.ts` with a `.ts.map`, meant to be type-checked by the consumer's `tsc` or bundler. `--emit js` prints the same IR without annotations (`.mjs` plus `.d.mts` for the host API). No TypeScript dependency is needed at compile time. `--check` runs `tsc` programmatically when `typescript` is installed (optional peer).

## Two layers of checking, deliberately separate

**Layer 1: compiler-native shape analysis (metadata-driven, emits diagnostics with JSON paths).**

The lattice is per key: Present(type) / Absent / Maybe(type), plus `open`. Initial state per run:

- timeline and init runs: closed `{}`, because the engine calls `start()`/`end()` with no arguments (eligius-engine.ts:947, 1502);
- event actions: closed `{eventArgs: <tuple from events metadata>}`;
- actions in `actions` (callable through startAction or controllers): `open`.

The transfer per op is:

1. merge the configured keys (Present);
2. check `dependentProperties` (Present gives OK, Maybe gives W, Absent and closed gives E);
3. check `required` properties against the configured keys (E);
4. apply `erased` (Absent);
5. apply `outputProperties` (Present);
6. for opaque ops (customFunction, invokeObjectMethod, setOperationData with `override`, clearOperationData without a list, loadJson, addGlobalsToOperation, custom ops), set `open` and mark keys Maybe.

Control-flow joins take the union (If/Else join; loops run to a fixpoint, in practice two passes). Errors that become possible:

- E101 unbalanced or crossing when/forEach blocks; E102 break/continue outside a loop (the interpreter makes this a no-op, loop-jump.ts; it is reported as W, not E).
- E110 missing dependency on a closed shape (for example addClass before any selectElement).
- E111 missing @required configured property.
- E120 literal value outside a literal union (for example `insertionType: 'apend'`).
- E130 `when` syntax error (reusing parseExpression's own messages and positions); E131 unknown operand.
- E140 forbidden chain segment (assert-safe-property-chain.ts); E141 `__proto__` key in operation data (the interpreter fails only when the op runs, action.ts:318-322).
- W150 chain-looking string in a field without `@resolves`.
- W151 `$operationdata.x` read where x is Absent on a closed shape (reads undefined at runtime).
- W152 `$scope.variables.x` read before any setVariable on every path (throws at runtime).
- E160 setData write to a reserved scope key (`newIndex`, `loopIndex`, ...), which forces interpreted or mode S.
- E310 unknown literal requestAction name; W311 customFunction/getImport/controller name not in the compile manifest.

The policy is that compile errors are only raised for things that are certainly wrong on every execution or are syntax errors. Anything that depends on runtime values stays a warning, and the emitted code keeps the runtime behaviour (lazy throws, short-circuit skipping of bad chains, parse-expression.ts:308-317).

**Layer 2: TypeScript in the emitted code.**

- `satisfies IXOperationData['key']` on every configured literal. This is precise and has no false positives: it checks config values against the declared property types, which are richer than the JSON schema's ParameterType collapse (parameter-type-schema.ts).
- The bag is typed `TOperationData` with `as IXOperationData` casts at call sites. The casts are deliberate. The real output generics are imprecise: selectElement's output is `Omit<ISelectElementOperationData, 'selector'|'useSelectedElementAsRoot'>`, in which `selectedElement` is optional (select-element.ts:31, 43-46), while addClass requires `selectedElement: JQuery` (add-class.ts). Threading real types would make tsc reject `selectElement -> addClass`, the most common chain in the codebase. Layer 1 owns dependency checking. Making the output generics precise (`RequireKeys<..., 'selectedElement'>`) is a separate, opt-in Phase 7 decision.
- Intrinsic code is fully typed. The compiler's own CI compiles every fixture's output under `strict`, which catches codegen bugs.
- The host-facing API is typed: `createPresentation`, `actions.HighlightItems: ITimelineAction`, event-action init `{eventArgs: [language: TLanguageCode]}` from the events metadata (args type text, events/metadata/types.ts), and custom function signatures `(this: IOperationScope, data: TOperationData) => unknown` checked against the user's imported functions.

## How @dependency / @required / @erased feed the analysis

These tags are read from the generated metadata (`dependentProperties`, `properties[k].required`, `properties[k].erased`, `outputProperties`; operation/metadata/types.ts:41-47). The dossier found them hand-maintained but cross-checked: there is one known mismatch, `removePropertiesFromOperationData.propertyNames`. A Phase 0 conformance spec therefore verifies every `@erased` property against its implementation's mechanism (removeProperties/delete/rest/filter). It is a ts-morph scan plus one runtime probe per op through `applyOperation`, so the compiler never trusts metadata that has not been checked.

## Testing strategy

## 1. Differential harness (the core guarantee)

`src/test/compiler/differential/harness.ts`:

- Compile a configuration in-process, since the compiler is Node-runnable.
- Write the module to a gitignored `src/test/.compiled/<hash>.ts` and import it through vitest, which handles TS and the aliases.
- Build two engines on separate eventbuses and jsdom containers, one from the interpreter (`ConfigurationResolver` plus EligiusResourceImporter) and one from the compiled module.
- Drive both through the same script: init, seek, play ticks, event broadcasts, switchTimeline, destroy.

Compared after every step:

- container `innerHTML` and the classes on the root;
- the eventbus broadcast log (wrapped `broadcast`/`broadcastForTopic`), name plus args;
- a globals snapshot (`getGlobals()` deep-serialised);
- each action promise's final operation data, structural deep-equal over enumerable keys **in order**, and identity-preserving for jQuery and DOM;
- an operation call trace (systemName, index and phase, recorded by wrapping the op functions in both builds through an injectable op table);
- errors: message, `operationSystemName`, `operationIndex`, and the EngineActionError message;
- timing markers: `syncSettled`, recorded as whether `done` ran before `start()` returned, which pins timeline-action.ts:92-122, and the number of microtask turns to settle, measured with a `queueMicrotask` counter.

## 2. Fixtures

- Every config in src/test/integration (for-each-loop, when-construction, end-in-correct-order, re-use-image-action, engine-smoke, ...).
- Every operation spec lifted to a one-op action: each operation's spec input becomes a single-operation action.
- A **quirks suite**, one test per hazard in the dossier: loopLength = length-1; `collection` stays in the bag; the forEach re-merge restores `collection` that the body overwrote; `'false'` and `'0'` are truthy; strict `==`, so `$x==null` is false for undefined; `!` binds tighter than comparisons; `+suffix`, `a+b+c` keeping only `b`, and an empty suffix; `a..b` and `$operationdata.` (empty path) returning the bag; bracket indices; `$globaldata` deepCopy against the `$operationdata` reference; setOperationData `override`; an op returning undefined, which yields `{}`; a promise resolving to undefined; break inside a nested when; an empty or null collection; an async op inside a loop; a startAction callee that is already active (resolves `{}`); a non-Error throw being wrapped; the innermost annotation winning.

## 3. Fuzzing

Use fast-check as a new devDependency with a grammar-based generator of well-formed op lists of depth 4 or less. The generator draws from when/otherwise/endWhen/forEach/break/continue/setData/setVariable/setOperationData/calc/math, a deterministic stub customFunction that mutates `this` and the bag, and `wait 0`. It generates random chains, including null intermediates and forbidden segments, random globals, and random event args. Each case runs through both paths with the comparisons from 1. The run size is 2,000 cases in CI and 50,000 nightly. Failing seeds are shrunk and committed as fixtures.

## 4. Keeping interpreter and compiler from drifting

- **Shared semantic core.** One `walkChain` function used by getPropertyChainValue and by `readChain`. One `parseExpression` AST used by `when` (cached on the resolved operation, an interpreter quick win) and by the compiler. Configuration validation goes through the real ConfigurationResolver in the compiler. Whatever cannot drift is shared, not copied.
- **Intrinsic registry.** Each intrinsic declares the op it replaces and has a mandatory property test: random data and scope, compared against `applyOperation(realOp, ...)` (util/apply-operation.ts). A conformance spec fails when an op has an intrinsic without a test.
- **Metadata conformance.** `@resolves`, `@async`, the derived `scope` and `@erased` are verified against implementations by the ts-morph scan and runtime probes. A changed op that invalidates its tags fails CI before the compiler mis-compiles it.
- **Golden snapshots.** `toMatchFileSnapshot` keeps the emitted code for 20 representative configs, so codegen changes are reviewed as diffs.
- **CI job** `npm run test:compiler`: differential plus fuzz plus `tsc --noEmit` over every emitted module under strict.
- **ABI version.** The runtime's `COMPILED_ABI_VERSION` is asserted by generated modules. Bumping it is a deliberate act tied to a CHANGELOG entry.

## 5. Benchmarks

Add `npm run bench` (vitest bench) and port the dossier's temporary spec permanently: interpreted vs compiled-L vs compiled-S vs handwritten, for the full action, no-forEach, no-when, a 200-item loop, and resolver startup for 130 ops against the compiled resolver. Phase exits are tied to these numbers. Also add a bundle-size fixture: an esbuild build of a sample presentation via EligiusResourceImporter vs via compiled `createImporter`, min+gzip, asserted to shrink.

## Phases

### Phase 0: Shared semantic core, metadata tags, benchmark harness

Estimate: 1.5 weeks

Deliverables:
- Extract `walkChain` from getPropertyChainValue (get-property-chain-value.ts:34-87) and a `parseChainLiteral` (prefix, segments, brackets, suffix) shared by the runtime and the compiler; the interpreter behaves the same, guarded by the existing helper specs.
- Cache parsed `when` expressions per configured object (WeakMap keyed by the configured operationData), an interpreter quick win the compiler reuses.
- New doc tags and generator support: `@resolves chain|deep|elements|expression`, `@async always|maybe`, and auto-derived `scope: none|eventbus|full` (ts-morph `this.` walk) in src/tools/code-generator/metadata-generator.ts; added to IOperationMetadata as optional fields (additive).
- Conformance specs: @erased vs implementation, @resolves vs resolver imports, @async vs promise-returning bodies, scope vs `this` usage.
- `npm run bench` with the dossier scenarios as permanent benchmarks.

Exit criteria: All existing tests green; tags present on all ~80 ops; the conformance specs pass; the bench reproduces the dossier numbers within ±15%; `when` caching shows a measurable gain on the full action.

### Phase 1: Compiler front end (parse, resolve, structure, diagnostics)

Estimate: 1.5 weeks

Deliverables:
- src/compiler/ with alias @compiler/* added to tsconfig.json, vitest resolve and the tsdown alias plugin together (CLAUDE.md rule).
- JSON-with-offsets parser and a JSON-path to offset table.
- Stub importer from eligius/metadata plus a compile manifest (`eligius.compile.json`: custom operations, functions, controllers, templates, json, plus module paths for imports).
- Resolution through the real ConfigurationResolver with a capturing listener; resolver errors mapped to diagnostics.
- Block-structure recovery and the E101/E102 diagnostics; a diagnostic printer with code frames into the JSON.
- Fourth tsdown build `dist/compiler.mjs`, exports `./compiler`, typesVersions, a node-environment spec (jquery and lottie mocked to throw), a check-dist-types scenario.

Exit criteria: `eligius-compile --check-only` runs in plain Node on every fixture config and reports the same resolver errors (text and JSON path) as the runtime for a set of 30 invalid configs; zero jquery or lottie in the compiler bundle's graph (ts_dependency_tree).

### Phase 2: Faithful baseline codegen (mode S everywhere) and the runtime ABI

Estimate: 3 weeks

Deliverables:
- EIR and the TS/JS printers; every op emitted as a real call with literal config merges, a fresh literal for nested config, `?? {}`, and an `isPromise` check for anything not marked @async never.
- Control flow lowered to if/else/labelled for, with real scope objects mirroring Action._pushScope and the forEach fields (mode S).
- Runtime: CompiledAction/CompiledEndableAction/CompiledTimelineAction (overriding executeOperation), annotate, readChain/readGlobalChain on walkChain, loopCollection, pushScope, ABI assert; exported from src/index.ts.
- Compiled resolver plus `createPresentation` emission; the optional resolver-factory overload on EngineFactory.createEngine (additive).
- Per-action interpreted fallback for mode-G actions.
- Differential harness, quirks suite, fuzzing in CI.

Exit criteria: Every integration fixture, every lifted operation spec, the quirks suite and 2,000 fuzz cases are observably identical (DOM, broadcasts, globals, data, errors, sync-settled flag, microtask count for native promises).

### Phase 3: Analyses and optimised lowering (mode L, intrinsics)

Estimate: 3 weeks

Deliverables:
- Shape lattice, escape analysis, scope-feature analysis and async classification.
- Mode L: loop variables and `variables` as locals, static `$scope.*` resolution, only `scope.currentIndex` writes before real calls.
- Intrinsics: when/otherwise/endWhen (compiled expression AST), forEach family, setOperationData, setData (`$operationdata`/`$scope.variables` targets), setVariable; each with a mandatory property test against the real op.
- Elisions: redundant merges, deletes and forEach re-merges; the `$globaldata` leaf copy in literal comparisons and truthiness tests; Boolean() around boolean nodes.

Exit criteria: Differential suite still fully green; bench: full action at 60 us or less (from 583), no-forEach at 30 us or less (from 60), 200-item loop at least 10x faster than the interpreter; golden snapshots reviewed.

### Phase 4: Types, diagnostics, source maps

Estimate: 2 weeks

Deliverables:
- `satisfies` checks on configured literals; typed event-action init from events metadata; a typed host API and .d.mts for JS output.
- All Layer 1 diagnostics (E110-E160, W150-W152, E310/W311) with JSON paths and suggestions (reusing find-closest-names).
- Source map v3 to JSON byte offsets, per-op path comments, named run functions; `--input-source-map` composition (Eligian).
- `--check`, which runs tsc when typescript is installed.

Exit criteria: Every emitted fixture type-checks under strict; a seeded-error corpus (40 configs) produces the expected diagnostic codes and paths; a thrown error in a compiled action shows a stack frame that devtools and Node map to the JSON line of the failing operation.

### Phase 5: Tree-shaking and the CLI product

Estimate: 1.5 weeks

Deliverables:
- Audit for top-level side effects, then `"sideEffects": false` in package.json.
- `createImporter` (minimal importer) and generated imports limited to used ops, controllers, providers and the engine.
- `eligius-compile` bin (watch mode, `--emit ts|js`, `--out`, `--manifest`), docs in README and TypeDoc, CHANGELOG entry, CLAUDE.md update (new alias, scripts, entry).
- Bundle-size fixture test.

Exit criteria: The sample presentation's min+gzip bundle is measurably smaller than the EligiusResourceImporter build (the number is recorded in the CHANGELOG); `npm run check:types` covers the new entry; the published tarball compiles a sample project end to end.

### Phase 6: Resolution-split cores, deopt, Eligian integration

Estimate: 2.5 weeks

Deliverables:
- Split the chain-resolving ops (calc, math, createElement, setStyle, selectElement, broadcastEvent) into `resolveX` and `xCore`, with the op defined as `xCore(resolveX(...))`; the compiler calls the core with pre-resolved inline reads, removing the remaining roughly 5 us per chain read inside those ops.
- Mid-run deopt for mode-S runs whose customFunction or custom op sets `newIndex`: export setLoopCollection and the loop-data seeding hook; hand off to super.executeOperation.
- Eligian: `eligian build --compile` calls `eligius/compiler` on its IEngineConfiguration IR and composes its SourceMap (operation ids to DSL ranges); bump Eligian's eligius pin from 4.0.0.

Exit criteria: Differential suite plus deopt fuzz cases green; createElement-heavy loop bench at least 2x faster than in Phase 3; an Eligian sample builds a compiled bundle whose stack traces point to .eligian lines.

## Risks

- The speed payoff is small in absolute terms (H1). The benchmark's heavy action costs 0.58 ms, and actions run only at range boundaries, never per tick (eligius-engine.ts:1599-1613). If tree-shaking and diagnostics do not land (Phases 4-5), the project delivers microseconds. Mitigation: phase order and exit criteria put measured bundle size and diagnostics on the critical path, and Phase 0's interpreter quick wins are shipped regardless.
- Semantic drift between interpreter and compiler as operations evolve. Mitigations: shared walkChain and parseExpression, reuse of the real resolver, a small intrinsic set (about 10 ops) each with a mandatory property test, metadata conformance specs, and differential plus fuzz tests in CI. The residual risk is a new op whose tags are wrong but which still passes the conformance scan.
- CompiledX classes override the public `executeOperation` and rely on `_runOperations` calling it with index 0 (action.ts:61-88). A future refactor of Action could bypass compiled runs silently. Mitigation: a dedicated contract spec, and the Phase 2 note in CLAUDE.md.
- Timing differences with non-native thenables: `await` takes extra ticks for foreign thenables compared with `.then` in the interpreter. Native promises are matched. Documented, and fuzz cases cover native promises only.
- customFunction and custom operations may be common in real presentations. They force mode S around them (smaller gains) and, until Phase 6, a runtime error if they set `this.newIndex`. Mitigation: per-action interpreted fallback as the default policy for actions that statically contain them, switchable with a flag.
- The TS output generics are imprecise (optional `selectedElement` in selectElement's output, select-element.ts:31). Precise tsc chain typing would give false errors, so Layer 2 is limited to `satisfies` plus casts. Users might expect full chain typing from 'type-checked output'. Mitigation: state clearly that dependency checking comes from compiler diagnostics.
- `sideEffects: false` is wrong if any module registers something at import time; it would break consumers silently. Mitigation: an audit plus a bundle smoke test with every built-in imported individually.
- Public API growth: CompiledX classes, helpers, createImporter, the resolver-factory overload and the metadata fields become a maintained ABI for at least one major version under CLAUDE.md 'Deprecate for one major version before removal'.
- Eligian drift: Eligian pins eligius 4.0.0 and has its own generated registry (79 ops). The compiler and Eligian must move in lockstep, or Eligian keeps emitting configs that rely on tolerated-but-rejected structures (it lowers if/for to when/forEach, operation-transformer.ts:624-656).
- Compile errors for constructs the interpreter tolerates (unbalanced blocks, `__proto__` keys, when syntax that is never reached because of short-circuiting) change failure timing on purpose. Configs that 'work' today may fail to compile. Mitigation: these are errors only when certain; everything else is a warning, and there is a per-action fallback.
- Estimates assume one developer with an AI assistant and no surprises in the fuzzing phase. A non-trivial divergence found by fuzzing (for example in scope fallthrough via the `in` lookup, resolve-external-property-chain.ts:103-115) could add a week.

## Open decisions

- Faithful-plus-strict (recommended): reproduce every observable quirk for accepted actions, but reject unbalanced or crossing blocks and reserved-scope writes at compile time. The alternative is a documented strict subset that also rejects quirks such as `+suffix` with an empty suffix or `$operationdata.` with an empty path.
- Policy for customFunction or custom ops that may set `this.newIndex`: interpreted fallback per action (recommended until Phase 6), mode S plus a runtime error, or mode S plus deopt (Phase 6).
- How the compiled resolver gets the eventbus: an additive `createEngine(config, resolver | (eventbus) => resolver)` overload (recommended), or a new `IEngineFactory.createCompiledEngine(module)` method.
- Where the runtime ABI lives: the main `eligius` entry (recommended, one module instance for the globals store and liveEngineCount), or an `eligius/compiled-runtime` subpath built with `eligius` externalised.
- Ship the compiler as the `eligius/compiler` subpath plus bin in the same package (recommended for version lockstep), or as a separate `@eligius/compiler` package, which keeps compiler-only code out of the runtime tarball.
- Default emit target: TS (recommended, enables `satisfies` checks) or JS plus .d.mts for non-TS consumers.
- Whether to make the operation output generics precise (e.g. `RequireKeys<..., 'selectedElement'>`) so tsc can type whole chains. It is a public type change, possibly tightening user code, and needs a semver call.
- Whether `when` caching and pre-split chains should also land in the interpreter (Phase 0 recommends yes). That narrows the compiler's speed advantage but helps every runtime-loaded config.
- Eligian integration depth: call the compiler on IEngineConfiguration only (recommended for v1), or later accept structured control-flow hints from Eligian's AST to avoid re-deriving blocks from the flat list.
- Whether action-level dead-code elimination is worth adding behind an opt-in flag (`--closed-world`) for presentations that guarantee no host code calls request-action by name.

---

