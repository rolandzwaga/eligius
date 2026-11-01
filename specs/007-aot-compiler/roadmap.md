<!-- Generated 2026-11-01 from workflow run wf_a2f5d1c2-6fd (.claude/workflows/aot-compiler-plan.js). Opus synthesizer; inputs in research.md, plans.md, critiques.md. -->
# 007: AOT action compiler, roadmap

Status: planned, codegen gated · Date: 2026-11-01 · Inputs: research dossier (execution model, data resolution, config-to-engine, tooling), benchmark, Plan A (minimal), Plan B (complete), and three adversarial critiques (semantics, value, maintainability).

## 1. Summary

The idea is technically possible. Nothing in the engine prevents compiling actions to JavaScript:

- The engine uses actions only through `start()`, `end()`, `active`, `duration`, `id` and `name` (src/action/types.ts, src/eligius-engine.ts:1497-1509).
- Every run goes through one protected method, `Action._runOperations` (src/action/action.ts:61-88).
- Control-flow jump targets can be computed from the flat operation list.

The measurements do not support building the compiler first. The benchmark (13 ops, a 20-item `forEach`, jsdom) shows:

| Scenario | Interpreted | Hand-written | Ratio |
|---|---|---|---|
| Full action | 583 µs | 20 µs | 29x |
| Without `forEach` (9 ops) | 60 µs | 18.5 µs | 3.2x |
| Without `when` | 503 µs | 13.4 µs | 37x |
| ConfigurationResolver, 130 ops (one-time) | ~1.1 ms | 8.4 µs | — |

The interpreter's own bookkeeping (merge, scope, promise) is about 0.25 µs per op and about 1.3 µs per loop iteration. Nearly all of the gap is in a few avoidable costs, and the interpreter can fix them for every configuration, including runtime-loaded ones:

- `when` parses its expression on every execution (src/operation/when.ts:92).
- Every chain string is split, lower-cased, bracket-expanded and safety-checked on every read (src/operation/helper/resolve-external-property-chain.ts, get-property-chain-value.ts:46-53).
- `setOperationData` deep-copies its `properties` twice: once in `copyConfiguredOperationData` (action.ts:359) and again in `resolvePropertyValues` (resolve-property-values.ts:37-38).

Operations run only at action boundaries, never per tick.

The other promised wins do not need generated code either:

- **Tree-shaking.** It is blocked by a side-effect import that registers every operation (src/configuration/api/index.ts:4, which leads to `registerOperationTypes(operation_exports)` at dist/index.mjs:7277) and by `import * as ops` in the importer (src/importer/eligius-resource-importer.ts:3). That is an entry-point fix.
- **Compile-time diagnostics.** These need an analysis front end, not an emitter.
- **Stack traces.** `EngineActionError` already names the action, phase, operation and index (eligius-engine.ts:55-110).

The roadmap therefore has two parts:

1. **Phases 0-3, build now (about 5-6 weeks):**
   - measurement;
   - interpreter fast paths, pinned by a quirks suite;
   - a tree-shakable runtime entry;
   - a DOM-free `eligius/lint` validator;
   - a differential test harness.
2. **Gate G1.** The codegen decision is made on measured numbers from real presentations.
3. **Phases 4-5, build only if G1 passes (about 4 weeks):**
   - guarded structural codegen (Plan A's runtime model);
   - a small set of measured intrinsics running on the real scope objects;
   - a CLI.

## 2. Decision record (what the critics changed)

| Proposal | Source | Verdict | Evidence / reason |
|---|---|---|---|
| Structural compiler as a standalone first release | Plan A Ph.1 | **Deferred, merged with intrinsics, behind G1** | The real ops still run every scan and parse, so a structure-only compiler is roughly speed-neutral. The value critic and the maintainability critic both raised this as fatal. |
| "Static output" that ships compiled modules next to the full JSON | Plan A Ph.3 | **Cut as a size feature** | It makes the payload bigger. The only real size lever is the importer and entry restructuring (Phase 2 here). |
| Tree-shaking with `createImporter` + `"sideEffects": false` | A Ph.3, B Ph.5 | **Fixed in this design** | Both plans miss the top-level `registerOperationTypes(operations)` in src/configuration/api/register-operation-types.ts, imported by src/configuration/api/index.ts:4 and re-exported by src/index.ts:4. Phase 2 adds a runtime entry without that side effect and measures with a real bundler. |
| Mode L: lexical locals, real ops called with the root scope | Plan B | **Cut** | Real ops resolve `$scope.*` through `findDeclaringScope` on `this` (resolve-external-property-chain.ts:94-115). `createElement {text: '$scope.currentItem.label'}` inside a loop would throw "'currentItem' is undefined". The saving is about 1 µs per iteration. |
| In-place `setOperationData` intrinsic | Plan B | **Cut. Any intrinsic must snapshot all reads before writing and keep result identity** | set-operation-data.ts:27-42 resolves every chain against the rest copy `newOperationData`, then returns `{...newOperationData, ...resolved}`. Sequential in-place writes change `{a:'$operationdata.b', b:'$operationdata.a'}`. |
| Closed entry shape for event and lookup actions; shape-driven elisions | Plan B | **Cut** | Items in `actions`/`eventActions` can be started with arbitrary data by startAction and controllers. Controllers `Object.assign(operationData, result)` back into their own object (src/controllers/helper/controller-actions.ts:101), and the interpreter's first merge mutates that object (action.ts:181-184). Codegen never elides merges, deletes or identity changes. |
| Generated metadata (`@resolves`, `@async`, `outputProperties`) drives codegen | Plan B | **Cut. Metadata feeds lint warnings only** | outputProperties exists in 37 of 79 files, `@erased` is advisory, and the output generic is never read (metadata-generator.ts:70-88). A wrong tag would become a silent miscompile. |
| Ship the resolved config as literals, skip the resolver | Plan B | **Cut** | Saves about 1.1 ms per 130 ops. It needs a factory API change, because `IConfigurationResolver.process` gets no eventbus (src/types.ts:520-525). It also freezes `template:`/`json:` resources and resolver fixes into user artifacts. The resolver stays at runtime and EngineFactory keeps importing it (engine-factory.ts:8). |
| Emit TypeScript with `satisfies` against every `I*OperationData` | Plan B | **Cut** | The bag needs casts at every call site anyway (selectElement's output has an optional `selectedElement`, select-element.ts:43-46). Internal type tweaks would break consumer builds. Emit JS. |
| Large public ABI (CompiledX classes, readChain, pushScope, ...) | Plan B | **Cut** | Under CLAUDE.md, public API needs a deprecation cycle. Only `ICompiledActionModule` (opaque) and one factory option become public. The context API is `@internal`. |
| Test-only `new Function` auto-compile hook in the Action module | Plan A | **Cut** | Tests load real emitted module files from a gitignored folder through vitest instead. |
| Duplicated control-flow name constants in the compiler | Plan A | **Cut** | The resolver graph is jQuery-free (ts_dependency_tree on configuration-resolver.ts: 23 nodes, no jquery). Import `whenSystemName` and the other constants (when.ts:129-131, for-each.ts:131-132) directly. |
| Compiled bodies keyed by mutable public operation arrays | Plan A | **Fixed** | Per-run validation compares the array length and the op object identities recorded at install time (O(n) pointer compares). On a mismatch the run is interpreted. |
| Positional install keys plus a silent fallback | Plan A | **Fixed** | Key by action `id` when present, otherwise name plus position. The mismatch policy defaults to `throw` at `createEngine`, which fits CLAUDE.md's fail-fast rule. |
| Compiler's predicted jump targets might differ from runtime scans | both | **Fixed** | The compiler calls the same scan functions (`findNextFlowControlIndex`, `findEndWhenIndex`, `findEndForEachIndex`, `findEnclosingEndWhenIndex`; exported from their module files in Phase 1, not from `src/index.ts`) on a synthetic `{operations}` scope. If a scan target is not a lexical block boundary, for example `when / forEach / otherwise / endForEach / endWhen`, the phase stays interpreted. The runtime `newIndex` guards remain as a second net. |
| Interpreter caches, `npm run bench`, quirks suite, differential harness, lint catalogue | A Ph.2, B Ph.0/4 | **Kept and moved to the front** | These deliver value with no second execution path. |

## 3. Goals and non-goals

### Goals

1. Measure first. A permanent `npm run bench` and a real-browser profile of a real presentation decide whether codegen is worth building at all.
2. Make the interpreter faster for every configuration without observable semantic changes. A quirks suite pins today's behaviour before anything changes.
3. Make a presentation bundle shrink to the operations it uses, with a measured min+gzip number.
4. Report configuration errors at build time, with JSON paths, through `eligius/lint`. Structural errors also become resolver warnings.
5. If G1 passes: compiled actions that cannot diverge from the interpreter. They keep one semantic implementation (the real operations and Action's helpers), check every structural prediction at runtime, and fall back to the interpreter exactly.
6. No breaking API change. Everything is additive (minor release). Internal helpers stay `@internal`.

### Non-goals

- Replacing the interpreter, the JSON format or the schema.
- Compiling scheduling, position sources, providers, eventbus, adapters, controllers or locale handling (H2 is confirmed).
- A standalone bundle without the engine runtime.
- Turning the operation-data bag into locals, inlining DOM, animation or controller operations, or statically binding `requestAction`/`customFunction`/`getImport` names. The eventbus request costs about 0.05 µs, and on a shared eventbus the newest live engine answers (engine-factory.ts:188-196).
- Removing unused named actions. `request-action` is public runtime surface.
- Making `$scope.newIndex` gotos structured. They are handled by deopt.
- Emitting TypeScript, composing source maps with Eligian, or tracking a type lattice for codegen.

## 4. Architecture

```
src/
  operation/helper/expression-cache.ts      # Phase 1: bounded cache, expression string -> parsed AST
  operation/helper/chain-cache.ts           # Phase 1: bounded cache, chain string -> parsed segments/suffix
  operation/helper/flow-control-index.ts    # Phase 1: scan functions moved here and exported (module-level)
  runtime.ts                                # Phase 2: entry without configuration/api barrel and without EligiusResourceImporter
  importer/create-importer.ts               # Phase 2: tree-shakable ISimpleResourceImporter from explicit maps
  lint/                                     # Phase 3: DOM-free validator (alias @lint/*)
    stub-importer.ts                        #   metadata-backed ISimpleResourceImporter
    structure.ts                            #   block tree + diagnostics (reuses flow-control-index scans)
    checks/*.ts                             #   when syntax, chains, __proto__, literal unions, required, names
  lint.ts                                   # Phase 3: entry -> dist/lint.mjs
  compiler/                                 # Phase 4 (gated): DOM-free codegen (alias @compiler/*)
  compiler.ts                               # Phase 4 entry -> dist/compiler.mjs
  action/compiled-body.ts                   # Phase 4: @internal context types + WeakMap registry
  action/install-compiled-actions.ts        # Phase 4
  test/differential/                        # Phase 1+: harness, quirks suite, fuzzer
  test/bench/action-overhead.bench.ts       # Phase 0
```

Each new alias goes into tsconfig.json, vitest `resolve` and the tsdown alias plugin together (CLAUDE.md rule). Fix the existing drift while you are there: tsdown.config.ts has `@diagnostics` but lacks `@adapters` and `@locale`.

### DOM-free invariant (new and documented)

`eligius/lint` and `eligius/compiler` import the real ConfigurationResolver. Today its import graph (action.ts, when.ts, for-each.ts, parse-expression, chain helpers, deep-copy, globals, guards) contains no jQuery. Each new entry gets a node-environment spec copied from src/test/unit/configuration/api/node-environment.spec.ts, which mocks jquery and lottie-web to throw. A `ts_dependency_tree` check is recorded in the spec. CLAUDE.md gets a rule: modules reachable from configuration-resolver.ts must stay DOM-free.

### Runtime flow if Phase 4 ships

1. `new EngineFactory(importer, window, {compiledActions})`.
2. `createEngine(config)` runs the resolver as today (engine-factory.ts:299-304).
3. `installCompiledActions` attaches bodies to the resolver-built `startOperations`/`endOperations` arrays.
4. `Action._runOperations` checks a WeakMap. If there is a valid body it calls the internal driver `_runCompiled`; otherwise it calls `executeOperation`.

Nothing in EligiusEngine, TimelineAction, EndableAction, the listener, the responders or the operations changes.

## 5. Compilation model (Phase 4, gated)

### Rules

1. **One `d` bag, reassigned exactly like the interpreter:**
   - `Object.assign(d, copyConfiguredOperationData(op.operationData, op.systemName))`;
   - call the op;
   - `d = result ?? {}` (action.ts:181-184, 237);
   - the async default `?? {}` (action.ts:145,149).
2. **Real scope objects always.** Use `_pushScope` for when/forEach (action.ts:110-131), the `_loopOperationData` cache for forEach (action.ts:27, 172-195), and pop after endWhen, and after endForEach when `newIndex` is unset (action.ts:202-208).
3. **A `newIndex` guard after every op.** A predicted target becomes `break label` or `continue label`. Any other value deopts with `executeOperation(ops, next, resolve, reject, d, stack)`, which consumes the pending `newIndex` (action.ts:157-160).
4. **Await only real thenables** (`isPromise`). A fully synchronous action completes synchronously, which TimelineAction's `finish` needs (timeline-action.ts:92-135).
5. **Error annotation** through the same `withOperationContext` (action.ts:265-277), with the original index. Async rejections are annotated with the op that returned the promise (action.ts:230-232).
6. **No configuration data in the module.** The signature is the systemName sequence. An intrinsic additionally records a hash of its op's `operationData`. If the hash does not match at install time, that op falls back to calling the real function. Correctness is unaffected; the op simply loses the speed-up.
7. **Intrinsics** are accepted only when both hold:
   - (a) a property test against `applyOperation(realOp, ...)` (src/util/apply-operation.ts) with random data and scopes is green;
   - (b) the bench shows at least 30% per-op gain over the Phase 1 interpreter.

   Candidates: `when` (expression precompiled to JS, evaluated against the real when scope; it still sets `whenEvaluation` and the same `newIndex` and still erases `expression`) and `setOperationData` (all reads into temporaries first, then return a new object `{...rest, ...resolved}`, exactly like set-operation-data.ts:27-42). Chain reads go through the shared `walkChain` core (Phase 1), so error texts and the global-object guard are identical.

### Source

```json
{
  "id": "a3", "name": "HighlightItems", "duration": {"start": 2, "end": 8},
  "startOperations": [
    {"id": "o0", "systemName": "selectElement", "operationData": {"selector": "#list"}},
    {"id": "o1", "systemName": "when", "operationData": {"expression": "$globaldata.mode == 'compact'"}},
    {"id": "o2", "systemName": "addClass", "operationData": {"className": "compact"}},
    {"id": "o3", "systemName": "otherwise"},
    {"id": "o4", "systemName": "removeClass", "operationData": {"className": "compact"}},
    {"id": "o5", "systemName": "endWhen"},
    {"id": "o6", "systemName": "forEach", "operationData": {"collection": "$globaldata.items"}},
    {"id": "o7", "systemName": "createElement", "operationData": {"elementName": "li", "text": "$scope.currentItem.label"}},
    {"id": "o8", "systemName": "setElementContent", "operationData": {"insertionType": "append"}},
    {"id": "o9", "systemName": "wait", "operationData": {"milliseconds": 50}},
    {"id": "o10", "systemName": "endForEach"}
  ],
  "endOperations": []
}
```

### Emitted JS

```js
// Generated by eligius-compile. Do not edit. Signature-only module.
export default {
  format: 1,
  actions: {
    'id:a3': {
      name: 'HighlightItems',
      start: {
        signature: 'selectElement,when,addClass,otherwise,removeClass,endWhen,forEach,createElement,setElementContent,wait,endForEach',
        intrinsics: {1: {kind: 'when', dataHash: 'k3f9…', eval: when_o1}},
        body: HighlightItems$start,
      },
      // no end body: EndableAction short-circuits empty endOperations (endable-action.ts:27-29)
    },
  },
};

// $globaldata.mode == 'compact'  (parsed at compile time; == is strict, result coerced to boolean)
function when_o1(c, d, s) {
  return Boolean(c.readGlobal(['mode'], 'when', /*copyLeaf*/ false) === 'compact');
}

// timelines[0].timelineActions[?] id a3 .startOperations
function* HighlightItems$start(c, d) {
  let r;
  const s0 = c.root;
  // [0] selectElement (o0)
  r = c.run(0, s0, d); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(1, d);
  // [1..5] when / otherwise / endWhen   (targets 3 and 5 computed by the real findNextFlowControlIndex)
  const s1 = c.push(s0);
  w1: {
    o1: {
      r = c.run(1, s1, d); d = (c.p(r) ? yield r : r) ?? {};   // intrinsic or real `when`, same scope effects
      if (s1.newIndex !== undefined) {
        if (s1.newIndex === 3) { delete s1.newIndex; break o1; }
        if (s1.newIndex === 5) { delete s1.newIndex; break w1; }
        return c.deopt(2, d);
      }
      // [2] addClass (o2)
      r = c.run(2, s1, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s1.newIndex !== undefined) {
        if (s1.newIndex === 5) { delete s1.newIndex; break w1; }
        return c.deopt(3, d);
      }
    }
    // [3] otherwise (o3): real op, jumps to 5 when the condition was true
    r = c.run(3, s1, d); d = (c.p(r) ? yield r : r) ?? {};
    if (s1.newIndex !== undefined) {
      if (s1.newIndex === 5) { delete s1.newIndex; break w1; }
      return c.deopt(4, d);
    }
    // [4] removeClass (o4)
    r = c.run(4, s1, d); d = (c.p(r) ? yield r : r) ?? {};
    if (s1.newIndex !== undefined) {
      if (s1.newIndex === 5) { delete s1.newIndex; break w1; }
      return c.deopt(5, d);
    }
  }
  // [5] endWhen (o5): pop before the promise check, like action.ts:202-212
  r = c.run(5, s1, d); c.pop(); d = (c.p(r) ? yield r : r) ?? {};
  if (s0.newIndex !== undefined) return c.deopt(6, d);
  // [6..10] forEach / endForEach
  const s2 = c.loop(s0, 6);   // push + owner + configured data copied once (action.ts:188-195)
  l6: while (true) {
    e6: {
      r = c.iter(6, s2, d); d = (c.p(r) ? yield r : r) ?? {};   // real forEach: resolve once, slice, currentItem
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 10) { delete s2.newIndex; break e6; }   // empty collection
        return c.deopt(7, d);
      }
      // [7] createElement (o7): resolves $scope.currentItem.label against the real loop scope s2
      r = c.run(7, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 10) { delete s2.newIndex; break e6; }
        if (s2.newIndex === 6) { delete s2.newIndex; continue l6; }
        return c.deopt(8, d);
      }
      // [8] setElementContent (o8)
      r = c.run(8, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 10) { delete s2.newIndex; break e6; }
        if (s2.newIndex === 6) { delete s2.newIndex; continue l6; }
        return c.deopt(9, d);
      }
      // [9] wait (o9): native promise, the driver resumes in .then (one microtask, like action.ts:219-233)
      r = c.run(9, s2, d); d = (c.p(r) ? yield r : r) ?? {};
      if (s2.newIndex !== undefined) {
        if (s2.newIndex === 10) { delete s2.newIndex; break e6; }
        if (s2.newIndex === 6) { delete s2.newIndex; continue l6; }
        return c.deopt(10, d);
      }
    }
    // [10] endForEach (o10)
    r = c.run(10, s2, d);
    if (s2.newIndex === undefined) { c.pop(); d = (c.p(r) ? yield r : r) ?? {}; break l6; }
    d = (c.p(r) ? yield r : r) ?? {};
    if (s2.newIndex === 6) { delete s2.newIndex; continue l6; }
    return c.deopt(11, d);
  }
  if (s0.newIndex !== undefined) return c.deopt(11, d);
  return c.done(d);
}
```

### Why this matches the interpreter

- **Merge and copy.** `c.run(i, s, d)` sets `root.currentIndex = i` (the child-scope setter writes through, action.ts:118-120) and records the failing index. It performs the same merge and copy as action.ts:172-184, then calls `ops[i].instance.call(s, d)`. If the intrinsic is installed, it calls `intrinsic.eval` inside an op-shaped wrapper that also erases `expression`, sets `whenEvaluation`, and sets the same `newIndex`.
- **Lazy throwing and short-circuit.** A bad chain on the unevaluated side of `&&` still never throws (parse-expression.ts:308-317).
- **Unexpected jumps.** A customFunction or setData writing `$scope.newIndex` produces an unexpected `newIndex`, which leads to `deopt`. The interpreter then continues on the identical stack.
- **break/continue inside a when.** These hop through endWhen exactly as loop-jump.ts does, because the real ops still run and only their predicted targets are turned into labels.
- **startAction and controllers.** startAction, endAction and controllers call `start()`/`end()` on instances. Each instance picks its own body, so compiled and interpreted actions mix freely. TimelineAction's active flag and queue are untouched.

## 6. Runtime contract and engine changes

### Phases 1-3 (no codegen)

| Change | File | Kind |
|---|---|---|
| Parse cache, keyed by expression string. Successful parses only; bounded (LRU, 500 entries); cleared with `clearGlobals`/`clearJsonCache` when the last engine is destroyed (engine-factory.ts:285-290) | src/operation/when.ts:92, new expression-cache.ts | internal, no API |
| Chain parse cache: prefix, segments, bracket expansion, `+suffix`, forbidden-segment check. Errors are constructed fresh on every read, so the op name still comes from `getCurrentOperationName(scope)`. Null-intermediate throws and the global-object guard stay per read. Extract `walkChain` as the single core | get-property-chain-value.ts, resolve-external-property-chain.ts, assert-safe-property-chain.ts | internal |
| Flow-control scans moved to one module and exported at module level (not from src/index.ts); optional per-array index cache validated by length | when.ts:110, otherwise.ts:19, for-each.ts:114, loop-jump.ts:122 | internal |
| Investigate dropping the second deepCopy in `resolvePropertyValues` (resolve-property-values.ts:37-38). **It is not safe as a plain removal.** Inside forEach the configured copy is cached and shared across iterations (action.ts:176-194), and the top-level `target[key] = resolved` would overwrite the chains of iteration 2. Implement it as top-level copy-on-write (the nested level is already copy-on-write), and ship it only if the quirks and differential suites show no aliasing difference | resolve-property-values.ts | internal, conditional |
| Structural warnings in the resolver: unbalanced or crossing when/forEach, a stray endWhen (today it crashes with a TypeError at action.ts:156,207). Warning now, error in the next major (CHANGELOG) | configuration-resolver.ts | additive behaviour |
| `src/runtime.ts` entry (`eligius/runtime`): EngineFactory, EligiusEngine, actions, operations by name, providers, controllers, `createImporter`, globals helpers. No configuration/api barrel, so no `registerOperationTypes` side effect, and no EligiusResourceImporter. It is built **in the same tsdown build as index** (multi-entry), so the module singletons (globals store, loadJson cache, `liveEngineCount` at engine-factory.ts:62) live in one shared chunk | tsdown.config.ts, package.json exports/typesVersions | additive (minor) |
| `createImporter({engines, operations, controllers, providers, functions, templates, json})`, with the same registration rules as EligiusResourceImporter but no namespace import | src/importer/create-importer.ts | additive |
| `"sideEffects"` field listing the real side-effect modules (at least `register-operation-types.ts`), only after the bundler measurement in Phase 2 | package.json | additive |
| `eligius/lint` entry: `lintConfiguration(config, {customOperations, customFunctions, ...}) => Diagnostic[]` | src/lint.ts | additive |

### Phase 4 (gated)

| Change | File | Kind |
|---|---|---|
| `_runOperations`: `const body = getValidBody(operations)` (WeakMap get, length check, identity check against the refs recorded at install). Call `_runCompiled` if present, otherwise `executeOperation` unchanged. `onSettled` wrappers unchanged | src/action/action.ts:61-88 | internal |
| `_runCompiled`: a private generator driver of about 60 lines that uses `_pushScope`, `_loopOperationData`, `copyConfiguredOperationData` and `withOperationContext` in place. The first `gen.next()` runs inside the Promise executor | src/action/action.ts | internal |
| `ICompiledContext`, `TCompiledBody`, registry | src/action/compiled-body.ts | `@internal`, not exported |
| `ICompiledActionModule` (opaque: `format`, `actions`), `installCompiledActions` | src/action/install-compiled-actions.ts, src/index.ts, src/runtime.ts | public, additive |
| `IEngineFactoryOptions.compiledActions?`, `compiledActionsMismatch?: 'throw' \| 'interpret'` (default `'throw'`), installed right after `resolver.process` | src/engine-factory.ts:299-304, src/types.ts | public, optional fields |
| `format` integer. Any change to `executeOperation` dispatch (push/pop rules, `newIndex` consumption, `?? {}`) must update `_runCompiled`, bump `format`, and pass the compiled differential project. A comment block in `executeOperation` plus a CLAUDE.md rule | action.ts, CLAUDE.md | process |

## 7. Type strategy

- **No type system for operation data.** The bag stays `TOperationData`.
- **Lint uses metadata for warnings only:**
  - `dependentProperties` with no upstream producer (W110);
  - a missing `required` property (E111);
  - a literal outside a literal union (E120).

  Inside branches that are not taken on every path, these are warnings.
- **Lint errors**, only for things that are certain or syntactic:
  - E101: unbalanced or crossing blocks;
  - E130/E131: `when` syntax and unknown operands (reusing `parseExpression` messages and positions);
  - E140: forbidden chain segments;
  - E141: a `__proto__` key in operation data (the interpreter only fails when the op runs, action.ts:318-322);
  - E310: an unknown literal `requestAction` name (the names in `actions` ∪ `eventActions`, configuration-resolver.ts:152-160);
  - every resolver error (same text and JSON path, because the real resolver runs).
- **Lint warnings:**
  - W150: a chain-looking string in a field the op never resolves. This needs a resolution table; keep it as a hand-maintained list in `src/lint/resolving-fields.ts`, plus a conformance test that greps the op files for resolver imports;
  - W151: `$operationdata.x` read where x is absent on every path from a timeline or init action (only those start from `{}`, eligius-engine.ts:947,1502);
  - W160: setData writing reserved scope keys.
- **Lookup and event actions** always start with an open, caller-owned bag.
- **Generated code (Phase 4)** is JS plus a one-line `.d.ts` (`declare const m: import('eligius').ICompiledActionModule`).

## 8. Testing strategy

1. **Quirks suite (Phase 1, before any optimisation).** `src/test/differential/quirks.spec.ts` has one test per dossier hazard:
   - `loopLength = length-1`;
   - `collection` stays in the bag, and the per-iteration re-merge restores it;
   - `'false'`/`'0'` are truthy;
   - strict `==` (`$x==null` is false for undefined);
   - `!` binds tighter than comparisons;
   - `+suffix`, `a+b+c` and an empty suffix;
   - `$operationdata.` returns the bag;
   - bracket indices;
   - a `$globaldata` read returns a deep copy, while `$operationdata` returns a reference;
   - setOperationData's `override` and the property-swap case;
   - returning undefined resets to `{}`; a promise resolving to undefined does the same;
   - break and continue inside nested whens;
   - an empty or null collection;
   - an async op inside a loop;
   - startAction against an already-active TimelineAction (resolves `{}`, timeline-action.ts:55-57) and queueing behind a running callee;
   - non-Error throws are wrapped; the innermost annotation wins;
   - a controller-driven chain, asserting the controller's own object after the run (controller-actions.ts:101);
   - scan-disagreement configs (`when / forEach / otherwise / endForEach / endWhen`).

   It runs in the default project. Every Phase 1 change must keep it green.
2. **Differential harness (Phase 1 infrastructure, used fully in Phase 4).** Two engines on separate eventbuses and jsdom containers, driven by one script (init, seek, ticks, events, switchTimeline, destroy). After every step it compares:
   - container `innerHTML`;
   - the broadcast log;
   - a `getGlobals()` snapshot;
   - final data, with ordered keys and jQuery/DOM identity;
   - the op call trace;
   - the error message, `operationSystemName` and `operationIndex`;
   - the `syncSettled` flag;
   - the microtask count for native promises.

   In Phase 1 it compares the old interpreter (a pinned copy under `src/test/differential/reference-interpreter/`, deleted after Phase 4) with the optimised interpreter. In Phase 4 it compares interpreted with compiled.
3. **Compiled project (Phase 4).** A vitest project `compiled` compiles every action-bearing fixture to real `.mjs` files in a gitignored `src/test/.compiled/` and imports them. It reruns `src/test/unit/action/**`, the engine and factory specs and `src/test/integration/**` with `compiledActions` set. `afterEach` asserts zero deopts unless a test opts in with `expectDeopt()`.
4. **Fuzzer.** A seeded generator, with fast-check as an open decision. It produces well-formed op lists from the control-flow ops, recording ops, and chaos ops (return undefined or a new object, resolved or rejected promises, non-Error throws, random `this.newIndex`, nested config mutation), plus about 10% malformed lists and post-install array mutation. 2,000 cases run per CI run with fixed seeds plus one rotating logged seed.
5. **Intrinsic property tests** against `applyOperation(realOp, ...)`, mandatory per intrinsic.
6. **Node-environment specs** for `eligius/lint` and `eligius/compiler`; a `check:types` scenario for each new entry.
7. **Bench** (`npm run bench`, vitest bench). Numbers are recorded in specs/007-aot-compiler/measurements.md. There is no CI gate, because timings vary by machine.

## 9. Phased implementation plan

### Phase 0: measure (go/no-go baseline) · 3-4 days

**Deliverables**

- `src/test/bench/action-overhead.bench.ts` and `npm run bench`. Port the dossier's temporary spec with four variants:
  - (a) interpreted;
  - (b) **direct-call ceiling**: hand-written structured control flow that calls the real op functions with real `_pushScope`-style scopes. This is the upper bound for Phase 4 without intrinsics;
  - (c) hand-written jQuery;
  - (d) resolver startup for 130 ops.

  Scenarios: full action, no-forEach, no-when, and a 200-item loop.
- Real-browser profile (Chrome Performance panel) of at least two real presentations, for example Eligian samples. Record:
  - actions per boundary;
  - the worst boundary in ms;
  - loop sizes;
  - the share of the boundary spent in Action and operation helpers versus jQuery and layout.
- Bundle baseline: a Vite production build of a sample deck, min+gzip, with (i) EligiusResourceImporter and (ii) a hand-written minimal importer. This shows the cost of the `registerOperationTypes` side effect.
- Corpus scan of src/test/**, README examples and Eligian fixtures for:
  - unbalanced blocks;
  - `$scope.newIndex` writes;
  - customFunction and custom-operation use;
  - loop sizes.
- specs/007-aot-compiler/measurements.md.

**Files:** src/test/bench/action-overhead.bench.ts (new), src/vitest.config.ts (bench include), package.json (`bench` script), specs/007-aot-compiler/measurements.md (new).

**Exit criteria**

- All four variants and the browser profile are recorded.
- The owner has seen the direct-call-ceiling number.
- The bundle baseline is recorded.

### Phase 1: interpreter fast paths, quirks suite, harness · 1.5 weeks

**Status (2026-11-01): done on branch feat/aot-compiler-phase-0.** Quirks suite (32), differential harness (1000 fuzzed cases per run, fast-check), chain and expression caches, shared flow-control scans, faster deepCopy. Full action 2.04x faster; see measurements.md section 6. The reference interpreter is pinned at d937f6be.

**Deliverables**

- The quirks suite, written and green **before** any change.
- The differential harness against a pinned reference interpreter.
- The expression cache, the chain parse cache with the shared `walkChain`, and the flow-control scan module.
- The conditional copy-on-write in `resolvePropertyValues`.
- Re-run the bench.

**Files:** src/operation/when.ts, src/operation/otherwise.ts, src/operation/for-each.ts, src/operation/helper/{loop-jump,get-property-chain-value,resolve-external-property-chain,assert-safe-property-chain,resolve-property-values}.ts, new helper/{expression-cache,chain-cache,flow-control-index}.ts, src/engine-factory.ts (cache clearing at last destroy), src/test/differential/**.

**Exit criteria**

- The full suite, the quirks suite and the differential harness (interpreter vs reference) are green, with every error message unchanged.
- The bench shows at least a 2x improvement on the full action, with a target of 583 µs → ≤ 250 µs.
- CHANGELOG entry (patch or minor).

### Phase 2: tree-shakable runtime entry · 1-1.5 weeks

**Deliverables**

- `src/runtime.ts` as a second entry in the **same** tsdown build as index, so singletons are shared.
- `createImporter`.
- `"sideEffects"` declared after an audit.
- Exports and typesVersions for `./runtime`.
- A `check:types` scenario.
- A bundle-size fixture test: a sample deck built with Vite or Rollup using `eligius/runtime` + `createImporter` with about 15 ops.
- TypeDoc and a README section, "Smaller bundles".
- Offer Eligian's runtime-bundler a switch to `createImporter`.

**Files:** src/runtime.ts, src/importer/create-importer.ts, src/importer/index.ts, tsdown.config.ts, package.json, src/tools/type-tools/check-dist-types.ts, src/test/integration/bundle-size.spec.ts (or a script), README.md, CHANGELOG.md.

**Exit criteria**

- The sample deck's min+gzip is measurably smaller than the Phase 0 EligiusResourceImporter baseline, with the number in the CHANGELOG.
- Importing both `eligius` and `eligius/runtime` in one app shares one globals store (test).
- `npm run build` and `npm run check:types` pass.
- If the shared-chunk approach does not shrink the bundle, the documented fallback is lazy registration for the `...ByType` API (an explicit `registerOperationTypes()` call). That is a behaviour change for `...ByType` users and needs the owner's decision; see Open decisions.

### Phase 3: `eligius/lint` and resolver structural warnings · 1.5-2 weeks

**Deliverables**

- A DOM-free validator that runs the real ConfigurationResolver with a metadata-backed stub importer. It deep-copies the input first, because the resolver mutates it (configuration-resolver.ts:827-853).
- The diagnostics from section 7, with JSON paths and did-you-mean suggestions.
- Structural warnings inside the resolver.
- A node-environment spec and a `check:types` scenario.
- Optional `eligius-lint` bin.
- Docs.

**Files:** src/lint/**, src/lint.ts, src/configuration/configuration-resolver.ts, tsconfig.json/vitest/tsdown aliases, package.json, src/test/unit/lint/**.

**Exit criteria**

- A seeded-error corpus of 40 configs produces the expected codes and paths.
- The resolver errors are identical to the runtime's for 30 invalid configs.
- Lint loads in plain Node with jquery and lottie mocked to throw.

### Gate G1: build codegen or stop · half a day

Re-run Phase 0's browser profile and bench on the Phase 1 interpreter. Build Phase 4 only if **at least one** of the following holds:

- (a) A real presentation spends more than 4 ms in action execution at a single boundary, or drops frames attributable to Action or operation helpers.
- (b) The direct-call ceiling, or the ceiling plus a prototype `when`/`setOperationData` intrinsic, is at least 2x faster than the Phase 1 interpreter on the loop scenarios.
- (c) The owner explicitly wants compiled output for another reason, accepting the maintenance cost in section 10.

If none holds, the feature ends here. Record the decision in measurements.md.

### Phase 4 (gated): guarded codegen with intrinsics · 2.5-3 weeks

**Deliverables**

- The runtime seam and `_runCompiled` (section 6).
- `installCompiledActions` and the factory option.
- `src/compiler/`:
  - collect phases, with keys by `id` and otherwise name plus position;
  - a block tree that uses the real scan functions, with rejection reasons;
  - an emitter (section 5);
  - a `when` expression lowering from the `parseExpression` AST;
  - the intrinsic registry, accepting only intrinsics that pass section 5 rule 7;
  - `compileConfiguration(config, opts) => {code, dts, report}`.
- The `eligius/compiler` entry and a node-environment spec.
- The compiled vitest project, the fuzzer and the intrinsic property tests.

**Files:** src/action/{action,compiled-body,install-compiled-actions}.ts, src/action/index.ts, src/engine-factory.ts, src/types.ts, src/compiler/**, src/compiler.ts, tsconfig/vitest/tsdown, package.json, src/test/differential/**, CLAUDE.md, CHANGELOG.md.

**Exit criteria**

- `unit` and `compiled` projects are green with zero unexpected deopts.
- The fuzzer shows no divergence.
- The bench shows compiled ≥ 1.5x faster than the Phase 1 interpreter on the loop scenarios. **If not, revert the seam and keep only the analysis.**
- typecheck, check:types and build pass.

### Phase 5 (gated): CLI and product polish · 1 week

**Deliverables**

- `eligius-compile <config.json> --out dir [--verify] [--entry]`. `--verify` fails on any mismatch, for CI. `--entry` emits an entry module using `eligius/runtime` + `createImporter` + `compiledActions`.
- An optional v3 source map from generated lines to JSON paths.
- README "Compiling a presentation".
- A handoff note for Eligian to call `compileConfiguration` on its IEngineConfiguration IR after it moves off its eligius 4.0.0 pin.

**Exit criteria**

- A sample presentation built with `--entry` behaves the same as the JSON path in a browser and in the jsdom integration test.
- `--verify` catches a structural edit made without a recompile.

**Totals:** Phases 0-3 take about 5-6 weeks. Phases 4-5, if G1 passes, add about 3.5-4 weeks.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The owner expects the 27x gap to become a 27x speedup | The summary and Phase 0 state the absolute numbers. Phase 1 delivers most of the speed for every config. |
| Interpreter caches change semantics (error op names, aliasing) | Cache only successful parses; build errors fresh at read time; keep the quirks suite and the differential run against a pinned reference interpreter. The resolvePropertyValues change is conditional on the suites. |
| Module-level caches conflict with "avoid global state" | Bounded caches of pure parse results only, cleared on last-engine destroy. Document them in CLAUDE.md. |
| The runtime entry duplicates singletons | Same tsdown build, shared chunk, and a test for it. |
| `sideEffects` declared wrong | Audit, list the real side-effect files explicitly, and smoke-bundle every built-in imported individually. |
| Lint's DOM-free graph regresses when someone imports jQuery into a resolver-reachable module | Node-environment spec plus a CLAUDE.md rule. |
| (Phase 4) Deopt hides compiler bugs | Zero-deopt assertion in the compiled project; report of phases left interpreted. |
| (Phase 4) Coupling to `executeOperation` dispatch | `_runCompiled` lives in the same class; `format` bump rule; CLAUDE.md rule; fuzzer. |
| (Phase 4) Stale bodies after host code mutates operation arrays | Per-run length and identity validation. |
| (Phase 4) The module and the JSON drift apart | Default `throw` at `createEngine`, plus `--verify` in CI. Data edits never break a module; only structural edits do. |
| (Phase 4) Output size from per-op guards (~150-250 B/op unminified) | Measured in Phase 5. Guard pruning is an open decision. |
| Eligian drift (eligius pin 4.0.0, its own bundler and registry) | Phase 2 and Phase 3 hand-offs go to Eligian first; coordinate pin bumps. |

## 11. Decisions (resolved by the project owner, 2026-11-01)

1. **G1 thresholds:** keep as written. Codegen is built only if a real presentation spends more than 4 ms in action execution at one boundary, or a prototype compiled path is at least 2x faster than the Phase 1 interpreter on the loop scenarios.
2. **Phase 2 fallback:** if the shared-chunk `eligius/runtime` entry does not shrink bundles, lazy registration for the `...ByType` fluent API (explicit `registerOperationTypes()`) may ship in a 4.x minor release with a CHANGELOG note.
3. **Resolver structural checks:** warnings now, promoted to errors in the next major.
4. **Compiled mismatch policy:** `throw` by default. A tripped guard is a compiler bug and must surface.
5. **Config generator for the differential harness:** add fast-check as a devDependency.
6. **CLI bins:** none. Ship programmatic APIs only; Eligian or build plugins wrap them.
7. **Jump guards in generated code:** universal guards after every operation. No pruning allowlist.
8. **resolvePropertyValues copy-on-write:** ship only if the Phase 1 quirks suite proves full equivalence, including the forEach loop-aliasing case. Otherwise keep the double copy.
   Outcome (Phase 1, 2026-11-01): not shipped. Sharing the configured `properties` object with the result is observable by anything that holds an earlier bag, for example a controller whose `init` received it by reference, so equivalence cannot be proven. `deepCopy` itself was made about 3x faster instead, which is exact.

## 12. Measurement plan (how to prove the benefit)

| Claim | Metric | Where | Pass |
|---|---|---|---|
| Interpreter fast paths help | µs per run, full / no-forEach / no-when / 200-item loop | `npm run bench`, Phase 0 vs Phase 1 | Full action ≥ 2x faster; no scenario slower |
| Real presentations benefit | ms per boundary (p50/p95/worst), dropped frames | Chrome Performance on two real decks, Phase 0 vs Phase 1 | Recorded; feeds G1 |
| Smaller bundles | min+gzip of sample deck | Vite/Rollup build, Phase 0 vs Phase 2 | Measurably smaller, number in CHANGELOG |
| Earlier errors | Diagnostics found in seeded corpus and in existing fixtures | `eligius/lint` | 40/40 seeded errors detected with correct JSON path |
| Codegen worth it (gated) | Compiled vs Phase 1 interpreter vs direct-call ceiling | `npm run bench` | ≥ 1.5x on loop scenarios, otherwise revert |
| No semantic drift | Differential harness and fuzzer divergences | CI | Zero |

All numbers go into specs/007-aot-compiler/measurements.md with machine, browser and commit hash.
