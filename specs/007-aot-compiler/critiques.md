<!-- Generated 2026-11-01 from workflow run wf_a2f5d1c2-6fd (.claude/workflows/aot-compiler-plan.js). Three Opus adversarial critics. -->
# AOT compiler: adversarial critiques

| Lens | Plan A | Plan B | Preferred |
|---|---|---|---|
| semantics | 6/10 | 4/10 | Hybrid |
| value | 3/10 | 3/10 | Neither as written; a hybrid without codegen first |
| maintainability | 5/10 | 3/10 | Hybrid, leaning heavily on A, and neither plan as written |

# Lens: semantics

Semantic equivalence and feasibility: where would compiled output behave differently from the interpreter (action.ts executeOperation, TimelineAction sequencing, control-flow ops, chain resolution, data identity), and is each plan's emitted code correct against the real operation signatures?

## Plan A

Score: 6/10

**Fatal flaws**

- (none)

**Major issues**

- It is not a compiler in the sense the owner asked for. The real when/otherwise/forEach/endForEach/break/continue operations still run and still do their runtime scans: findNextFlowControlIndex (when.ts:110-127), findEndWhenIndex with slice (otherwise.ts:19-34), findEndForEachIndex with slice (for-each.ts:114-129), findEnclosingEndWhenIndex (loop-jump.ts:122-137), plus parseExpression on every run (when.ts:92). Every Object.assign/copyConfiguredOperationData step still happens (action.ts:175-184, 344-363), and so does every scope push and every _loopOperationData WeakMap access (action.ts:186-195). Phase 1 only replaces the `systemName ===` dispatch in action.ts:172-208 with a generator, a per-run context object holding about 9 closures, a `c.p(r)` per op, and a guard per op. On sync-heavy actions it does more work per op than the interpreter. Its own exit criterion, 'compiled is no slower than interpreted', is at real risk of failing.
- Every benefit the plan claims can be had without Phase 1. The speed comes from the Phase 2 caches, which help the interpreter. Tree-shaking comes from the Phase 3 minimal importer, which is independent of compilation. Structural diagnostics are a lint pass over systemName lists. Readable stack traces are mostly already there via withOperationContext (action.ts:265-277). Phase 1 delivers infrastructure whose only consumer is Phase 4, and Phase 4 is gated and may never happen.
- The test-only auto-compile hook needs a branch in Action._runOperations, the hottest path. Bodies are keyed by the identity of the public, mutable `startOperations`/`endOperations` arrays (action.ts:31, endable-action.ts:10), and the signature is checked only at install time. A host that pushes to or splices those arrays afterwards runs a stale body whose `c.run(i)` indices point at the wrong ops. The plan needs a per-run length or signature recheck, or frozen arrays.

**Minor issues**

- The premise that the resolver graph might not be DOM-free is wrong. ts_dependency_tree on configuration-resolver.ts returns 23 nodes, none of them jquery (action.ts, for-each.ts, when.ts, parse-expression.ts, globals.ts, ...). The compiler could run the real resolver in Node for JSON-path validation instead of re-implementing the duplicate-name and structure checks.
- Order inversion: c.push/c.loop push the scope before the configured-data merge, while the interpreter merges first (action.ts:175-195). The only observable case is copyConfiguredOperationData throwing on a __proto__ key (action.ts:318-322), which abandons the run either way, so the effect is nil. It should still be documented, because the plan claims 'same order'.
- Generated code size (guards after every op) and the generator frames in async stack traces work against the 'readable stack traces' claim. After a yield, the stack is step -> gen.next -> body, not the call chain that led to the run.
- `installCompiledActions` keys timeline actions by position (`timelines[t].timelineActions[a]`). Reordering actions without recompiling degrades silently to interpreted under the default 'interpret' policy. Only a one-time warning surfaces it.
- Phase 2's 'parsed-chain cache memoises the forbidden-segment check per chain string' must keep the operation-name prefix dynamic (assert-safe-property-chain.ts:45-49, getCurrentOperationName at :58). Caching the thrown Error object would give it the wrong operation name.

**What is good**

- It is semantically the most defensible design I can construct against this interpreter. Every op is called with exactly the scope object the interpreter would use: child scopes from the private _pushScope, with currentIndex written through the setter to the root (action.ts:110-131). The same copyConfiguredOperationData and withOperationContext are used (action.ts:265-277, 344-363), and forEach iterations reuse the same _loopOperationData cache (action.ts:172-180, 194).
- The newIndex guards are exact. The interpreter consumes newIndex only from the top scope at the start of the next step (action.ts:156-160), so a guard that maps a predicted index to the structural location of that same index is equivalent by construction, even when a customFunction or setData writes a matching index. Any other value deopts to executeOperation with the live stack, and executeOperation takes the pending newIndex. I traced it against when/otherwise (when.ts:97-101, otherwise.ts:13-15), the empty-collection jump (for-each.ts:54-62 -> endForEach else-branch, end-for-each.ts:13-23), and a continue inside a when (loop-jump.ts:84-88 -> end-when continuePendingLoopJump -> applyLoopJump at :90-101). All three hit predicted targets or deopt correctly.
- Configs that the runtime scans read differently from well-nested parsing are safe. Example: `when / forEach / otherwise / endForEach / endWhen`, where when's scan ignores forEach depth (when.ts:113-125) and jumps into the loop. Here the guard sees an unpredicted target and deopts. It does not miscompile.
- Async timing is preserved. The first gen.next() runs inside the Promise executor (action.ts:68-87), only real thenables are yielded, the pop after endWhen happens before the promise wait (action.ts:202-212), and rejections are annotated with the index of the op that returned the promise (action.ts:213-232). Fully synchronous actions therefore still call TimelineAction's finish synchronously (timeline-action.ts:92-135).
- The emitted example is correct against the real ops. createElement's `$scope.currentItem.label` resolves against the real loop scope through findDeclaringScope (resolve-external-property-chain.ts:107-115). wait returns a native Promise (wait.ts:24). startAction always returns a Promise (start-action.ts:37). Data identity, including the in-place Object.assign that controllers depend on (controller-actions.ts:101-103), is untouched.
- The deopt counter asserted to zero in the compiled test project is the right answer to the 'safety net hides bugs' problem.

## Plan B

Score: 4/10

**Fatal flaws**

- Mode L calls the real, non-intrinsic operations with the ROOT scope (`selectElement.call(scope, d)`, `createElement.call(scope, d)` inside the loop in the emitted example). The interpreter calls them with the pushed loop or when child scope (action.ts:186-200). Every real op that resolves chains against `this` then gives a different answer: createElement elementName/attributes/text (create-element.ts:64-75), selectElement selector, setStyle properties, calc, math, broadcastEvent eventArgs (broadcast-event.ts:39), forEach collection, setData targets, all via resolveExternalPropertyChain -> findDeclaringScope(head, scope) (resolve-external-property-chain.ts:94-115). Example: a loop body with `createElement {text: '$scope.currentItem.label'}`, which is Plan A's own example and an ordinary pattern. Under mode L it throws `createElement: property chain 'currentItem.label' cannot be resolved: 'currentItem' is undefined.` (get-property-chain-value.ts:59-66), because the root scope has no currentItem. The interpreter renders the item. The same happens inside a when: `setData {'$scope.flag': ...}` writes to the when child scope in the interpreter, which is popped at endWhen (set-data.ts:94-95, action.ts:202-207), but to the root under mode L, where it persists. The plan's mode-S trigger list (customFunction, custom ops, `$scope.owner/whenEvaluation/currentIndex`) does not include '$scope.* string in a resolved field of a real op'. If the auto-derived `scope: full` tag does include it, almost every createElement/selectElement/broadcastEvent action falls to mode S and mode L is a corner case. As written, mode L miscompiles common configs silently. There is no runtime guard, unlike Plan A.
- The setOperationData intrinsic is wrong as emitted. The real op resolves ALL property chains against a snapshot `newOperationData` (the rest copy without override/properties, set-operation-data.ts:27-33, resolve-property-values.ts:32-53) and only then builds `{...newOperationData, ...resolvedProperties}` (:39-42). Plan B emits sequential in-place writes (`d.label = readChain(...); d.index = i3;`). A later property that reads a key written earlier in the same operation therefore sees the NEW value. Example: `properties: {a: '$operationdata.b', b: '$operationdata.a'}` swaps a and b in the interpreter, but Plan B sets both to the old b. Example: `{count: 1, label: '$operationdata.count'}` gives label = the old count in the interpreter and 1 in Plan B. All reads must be evaluated into temporaries before any write.
- The shape and escape model is unsound at entry for event actions and lookup actions. Plan B treats event actions as a closed `{eventArgs}` shape. But eventActions are in the request-action lookup (configuration-resolver.ts:152-160), so startAction and controllers start them with arbitrary data (controller-actions.ts:62, 99-103). Controllers also keep the init object and `Object.assign(operationData, resultOperationData)` the result back into it (controller-actions.ts:101-103). The interpreter's first merge mutates that caller-owned object (action.ts:181-184), and setOperationData/wait/startAction/setGlobalData then switch the chain to a new object. Plan B's in-place intrinsics keep mutating the caller's object where the interpreter stopped. Concrete case: action [setOperationData{properties:{x:1}}, ...] started by a DOMEventListenerController. In the interpreter the controller's object keeps the merged `properties` key, because setOperationData returns a new object. In Plan B it never gets one, so the next action in the controller chain receives different data. 'Absent'-based elisions (dropping `delete d.expression`, dropping the forEach re-merge) are also unsound once a caller can supply those keys.

**Major issues**

- Nothing checks the structural reconstruction at runtime. The three runtime scans use inconsistent nesting rules. when's false-jump counts only when/endWhen and returns the first depth-0 otherwise even inside a forEach (when.ts:113-125). The forEach-to-endForEach match ignores when (for-each.ts:114-129). The loop-jump endWhen search ignores forEach (loop-jump.ts:122-137). Plan B must reject exactly the configs where these scans disagree with lexical nesting (for example `when / forEach / otherwise / endForEach / endWhen`, where the interpreter jumps into the loop body with the when scope on top). Any gap is a silent miscompile. Plan A survives the same gap through guards; Plan B has no equivalent before Phase 6.
- Mode S before Phase 6: if a custom op or customFunction sets `this.newIndex`, the generated code raises a runtime error where the interpreter honours the jump (action.ts:157-160; customFunction's scope view writes land on the scope, custom-function.ts:80-105). The plan's answer is to interpret every action containing customFunction. Custom operations (importer `operations`) can set newIndex too, so they need the same fallback, and mode S then covers almost nothing until Phase 6.
- The deopt design cannot work as specified. The descriptor arrays `S`/`E` in the emitted code have no `instance`, but `super.executeOperation` calls `operationInfo.instance.call(...)` (action.ts:197), and IResolvedOperation requires `instance` (configuration/types.ts:514-519). The Phase 6 hand-off would throw a TypeError. Mode-S loop emulation also never registers the snapshot in for-each.ts's private `loopCollections` (for-each.ts:73-84), so after a deopt the re-executed forEach finds no snapshot and stops updating currentItem (for-each.ts:64-68). The plan names `setLoopCollection` but not the matching `_loopOperationData` seeding, which is private (action.ts:27).
- The runtime-resolver bypass conflicts with the actual factory API. `IConfigurationResolver.process(configuration, listener)` receives no eventbus (types.ts:520-525). createEngine creates the eventbus internally (engine-factory.ts:239), so compiled Action instances cannot capture it, and the emitted `createResolver` is literally unfinished (`const eventbus = /* captured below */`). The listener is typed IEventbusListener, not ActionRegistryEventbusListener, so `registerAction` needs a cast. The fix (an overload) is additive, but it contradicts 'zero breaking changes / no factory change' and shows the integration was never traced end to end.
- The `when` cache 'per configured object (WeakMap keyed by the configured operationData)' cannot be built inside when.ts. The op receives only the merged flowing bag (action.ts:181-200, when.ts:91-92), never the configured object. It would have to key on the expression string (pure parse) or move into action.ts.
- Folding the resolved configuration into literals freezes `template:`/`json:` host resources at build time (configuration-resolver.ts:775-865). It also cannot represent operationData values that deepCopy keeps by reference (jQuery, DOM nodes, class instances, functions: deep-copy.ts:78-92), which the ConfigurationFactory TS API can produce. 'Fresh literal per run equals deepCopy' holds only for JSON. Inputs that are not JSON need an explicit rejection rule.

**Minor issues**

- Mode-S loop emulation sets `s3.loopEndIndex = 10` unconditionally. On an empty collection the interpreter deletes loopEndIndex/loopIndex/loopLength/loopStartIndex (for-each.ts:54-62). Only customFunction or `$scope.loopEndIndex` can observe this.
- Eliding the `$globaldata` leaf deepCopy for comparisons changes failure behaviour. deepCopy uses structuredClone for Map/Set/Date (deep-copy.ts:97-112) and can throw DataCloneError, which the elided path skips. Rare, but it is a semantic difference that no test in the quirks suite covers.
- E110 is described as 'certain on every execution', but a missing dependency inside a when branch that is never taken is not certain. It should be a warning unless the op is on every path.
- `readChain(root, segs, startIndex, opName)` must rebuild the exact message text `'<op>: property chain '<chain.join('.')>' ...'` after bracket expansion (get-property-chain-value.ts:46-66). It must also apply the global-object guard at index>0 when starting mid-chain from `item3`, and on the final result (:67-84). The emitted example omits the original chain text, so parity depends on helper details the plan does not specify.
- Event-action init typed as `{eventArgs: [language: TLanguageCode]}` is too narrow for the same reason as the shape problem: lookup callers pass arbitrary data. The listener also passes non-array args through raw (actionregistry-eventbus-listener.ts:50).

**What is good**

- It correctly verified that ConfigurationResolver and action.ts are jquery-free (confirmed: ts_dependency_tree gives 23 nodes, no jquery). Running the REAL resolver at compile time with a stub importer is the right way to get identical JSON-path errors.
- Await discipline is right. It emits `await` only after ops that always return native promises (wait.ts:24, animate.ts:58, start-action.ts:37) and uses isPromise for 'maybe' ops (custom-function.ts:64-70). An await on a native promise takes the same single microtask hop as the interpreter's `.then` (action.ts:219-233). Phases without awaits are emitted as plain sync functions, which keeps TimelineAction's synchronous finish (timeline-action.ts:92-122). Error annotation through `at` reproduces failingIndex and asyncIndex (action.ts:170-171, 215, 230-232).
- Plugging in by overriding the public `executeOperation` in CompiledX subclasses inherits TimelineAction's active flag, queue and onSettled wiring unchanged (timeline-action.ts:54-135). EndableAction's empty-end short-circuit (endable-action.ts:27-29) is kept.
- The emitted example is mostly right for its own fixture. forEach leaves `collection` in the bag. loopCollection gives null -> [] plus the exact non-array error plus slice (for-each.ts:47-53, 102-110). `continue L3` is equivalent to the endWhen hop because nothing observable runs in between (loop-jump.ts:84-88). The satisfies targets exist and are exported (ICreateElementOperationData<T> is generic, create-element.ts:12; IClearElementOperationData exists, clear-element.ts:4).
- Rejecting the bag-to-locals rewrite, DOM-op inlining and static requestAction binding is well justified by the benchmark (merge plus bookkeeping about 0.25 us per op, eventbus request about 0.05 us).

## Preferred

Hybrid: Plan A's execution discipline (real scope objects always, real Action helpers, a newIndex guard after every op, deopt into executeOperation) with Plan B's narrow intrinsic set for the data-plumbing ops the benchmark blames (setOperationData, setData, when expression, forEach collection read). Each intrinsic is emitted against the real scope objects (no mode L), evaluates reads into temporaries before writing, and returns a new object wherever the real op does. Plan A alone is semantically safe but buys almost nothing. Plan B alone buys speed with three silent miscompile classes: mode-L scope substitution, the in-place setOperationData intrinsic, and the closed entry shape for lookup and event actions.

## Should this be built at all?

The compiler is feasible: nothing in the engine prevents it, and Plan A's guarded design shows that exact equivalence can be achieved. Whether it should be built depends on measurements neither plan has taken. The benchmark puts interpreter bookkeeping at about 0.25 us per op. The 27-37x gap sits in setOperationData/setData inside loops, through resolvePropertyValues' deepCopy (resolve-property-values.ts:37-38), per-run deepCopy of nested config (action.ts:352-360), chain re-parsing, and when re-parsing (when.ts:92). Interpreter-side changes can remove much of that with no new semantic surface: cache parsed expressions by string, cache parsed chains, and skip the defensive deepCopy in resolvePropertyValues when the configured properties object was already copied for this execution. Tree-shaking needs only a minimal importer, and structural diagnostics need only a lint pass. My recommendation: build the interpreter caches and the minimal importer first, re-run the benchmark, and only then build a compiler. If you do build one, use the guarded hybrid with real scopes. Do not build Plan B's mode L. Its scope substitution is the main source of unsoundness, and it saves about 1 us per loop iteration by the benchmark's own numbers.

## Things to cut

- Plan B mode L entirely (lexical locals for loop variables, `variables`, and calling real ops with the root scope). It is unsound for any real op resolving `$scope.*` (resolve-external-property-chain.ts:94-115), and the benchmark says scope bookkeeping is about 1 us per iteration.
- Plan B in-place setOperationData/setData intrinsics until they snapshot reads before writes and preserve the result-object identity of set-operation-data.ts:35-42.
- Plan B's closed-shape-based elisions (dropping deletes and re-merges) for any action reachable through request-action, meaning everything in `actions` and `eventActions` (configuration-resolver.ts:152-160).
- Plan B's runtime resolver bypass and literal resolved configuration in v1. It saves about 1.1 ms per 130 ops, needs a factory API change (types.ts:520-525), and freezes host templates and json.
- Plan A Phase 1 as a standalone release. Ship it only together with intrinsics, because on its own it does more work per op than the interpreter.
- Plan B Phase 7-style precise output generics. That is a public type change unrelated to equivalence.

## Things missing

- Neither plan checks controller-started actions: controllers pass a caller-owned object, the interpreter mutates it on the first merge (action.ts:181-184), and controllers merge results back into it (controller-actions.ts:101-103). The differential harness must include a controller-driven chain and compare the controller's object afterwards, not only the action result.
- A differential case for configs where the runtime scans disagree with lexical nesting. Examples: `when / forEach / otherwise / endForEach / endWhen` (when.ts:113-125 ignores forEach depth), and a break whose endWhen search crosses a forEach (loop-jump.ts:122-137).
- A rule for intrinsics: evaluate every chain read of one operation before any write, mirroring resolvePropertyValues resolving against the newOperationData snapshot (set-operation-data.ts:27-33).
- Plan B: how deopt gets `instance` on the descriptors, and how it seeds both private loop caches (for-each.ts loopCollections, action.ts _loopOperationData).
- A per-run signature or length check (or frozen operation arrays) so that mutating the public startOperations/endOperations arrays after install cannot run a stale compiled body.
- Measurement of the interpreter quick wins alone (expression cache, chain cache, dropping the redundant deepCopy in resolvePropertyValues when called from setOperationData on an already-copied configured object) before committing to a compiler. Both plans list caches but neither makes them the go/no-go baseline for the compiler itself.
- Coverage of startAction against an already-active TimelineAction callee (resolves `{}` without running, timeline-action.ts:55-57) and of queueing behind a running callee, in compiled-to-compiled and compiled-to-interpreted pairs.

## Recommendations

- Phase 0 for any plan: add `npm run bench`, then implement the expression-string parse cache (when.ts:92) and the chain-parse cache. Remove the second deepCopy in resolvePropertyValues (resolve-property-values.ts:37-38) for callers whose properties object is already a per-execution copy (action.ts:359). Re-measure the 583 us loop action before deciding on compilation.
- If you compile, adopt Plan A's runtime: bodies installed on resolver-built Actions, real scopes from _pushScope, the same copyConfiguredOperationData and withOperationContext, and a newIndex guard after every op with deopt to executeOperation. This is the only design I could not break with a counterexample.
- Add intrinsics on top of the guarded runtime only for ops with a property test against applyOperation(realOp) (util/apply-operation.ts): setOperationData (reads into temporaries, return a new object exactly like set-operation-data.ts:39-42), setData, `when` (a precompiled expression evaluated with the real when scope, still setting whenEvaluation and newIndex so the guards stay valid), and the forEach collection read.
- Treat every `actions` and `eventActions` entry as having an open, caller-owned init bag. Never elide merges, deletes or identity changes on entry for them. Only timeline and init actions start from a fresh `{}` (eligius-engine.ts:947, 1502).
- Run the real ConfigurationResolver in the Node compiler (verified jquery-free by ts_dependency_tree) instead of re-implementing validation.
- Make the differential harness compare the caller's init object (controllers), not only the resolved data. Fuzz the scan-disagreement configs and mutation of the operation arrays after install.

---

# Lens: value

Value, cost and scope: what users actually gain (speed, bundle size, startup, debuggability, type safety) against the owner's limited time, and whether a smaller change without codegen gets most of it.

## Plan A

Score: 3/10

**Fatal flaws**

- Phase 1, the actual 'compiler', removes almost none of the measured cost. The generated body still calls every real operation (`c.run` -> `ops[i].instance.call`), so the work the benchmark blames all stays. `when` still re-parses its expression on every run (src/operation/when.ts:92, no cache) and still scans for its jump target. forEach still finds endForEach by scanning. setOperationData still runs resolvePropertyValues, which deepCopies its `properties` (src/operation/helper/resolve-property-values.ts:37-38) after copyConfiguredOperationData has already deep-copied that same nested config (src/action/action.ts:359). That is a double copy, and Plan A keeps both copies. The only thing compiled away is the while-loop dispatch, which the benchmark puts at about 0.25 us per op. Plan A adds a generator object, closures and a guard after every op, so Phase 1 is roughly speed-neutral and may even be slower. That is 2.5 weeks (realistically 3.5-4) for an artifact no end user can notice. The pitch admits this, but the phase order still puts it before the caches that carry the value.
- The 'static presentation' deliverable makes output bigger, not smaller. The compiled module is shipped in addition to the full config JSON (the non-goals say the static bundle 'still ships the config JSON'). The plan's own estimate is 150-250 bytes of guards per op, 'which may exceed the JSON it mirrors'. The only size win comes from Phase 3's minimal importer, and that needs no compiler at all.

**Major issues**

- The value it claims for Phase 1 is weak and mostly available without codegen.
- Structural diagnostics (unbalanced when/forEach, stray endWhen) are a 1-2 day validator pass, either in ConfigurationResolver as warnings or in a DOM-free lint.
- Stack traces barely improve. Frames become `HighlightItems$start -> c.run -> op`, against `executeOperation -> op` today. EngineActionError already names the action, phase, operation systemName and index (src/eligius-engine.ts:55-90).
- It adds a WeakMap branch and a ~50-line `_runCompiled` driver to the hottest path (Action._runOperations, action.ts:61-88). It also creates a permanent coupling: any future change to executeOperation's dispatch rules must be mirrored in `_runCompiled`, with a `format` bump and a new CLAUDE.md rule. That is an ongoing tax on the solo maintainer, paid for a feature with no runtime payoff.
- The test machinery is heavy for the value delivered:
- a second vitest project that reruns the action, engine and integration suites under a `new Function` auto-compile hook;
- deopt accounting;
- a 2000-case fuzzer that compares microtask turn counts.
This is the most expensive part of Phase 1, and it exists only to prove that a no-speedup layer is equivalent.
- Phase 2 (when-parse memo, block-index cache, parsed-chain cache) is independent of Phases 1 and 3 and is the real speed lever for both modes. The plan concedes this in its open decisions, but still sequences it after the compiler.
- Phase 4 is where the speed would come from, and it is gated and optional. As written, the plan's 'compiler' never produces a meaningfully faster action unless a later gated phase passes.

**Minor issues**

- The estimates are optimistic. Phase 1 packs a runtime seam, compiler, emitter, fuzzer, a fourth tsdown build, exports and typesVersions, a node-environment spec and check:types into 2.5 weeks. Expect 3.5-4 weeks, so about 7-8 weeks for Phases 0-3.
- Generated output is signature-keyed. Any structural edit to the JSON without a recompile silently falls back to the interpreter (the default policy is 'interpret'), which makes the build step easy to forget and hard to notice.
- Readable traces through generator frames are arguably less readable than the current loop.

**What is good**

- The Phase 0 go/no-go gate is right. It measures a 'direct op calls in structured control flow' middle variant, which is precisely the ceiling this angle can reach, and it scans the corpus before any work is committed.
- It is the only plan that explicitly says speed should come from interpreter caches that benefit runtime-loaded configs too. Its Phase 2 list (memoised parseExpression, per-array jump-index cache, parsed-chain cache) is the best value-per-day work in either plan.
- Zero semantic re-implementation, so the drift risk is minimal. Deopt to executeOperation is a clean safety net, and the deopt counter asserted to zero stops the safety net from hiding bugs.
- The engine-side change is tiny and additive. The compiled module holds no data, so content edits need no recompile.

## Plan B

Score: 3/10

**Fatal flaws**

- The headline bundle and startup claim is false as designed. The runtime_contract says the compiler 'removes the Action interpreter loop and the ConfigurationResolver from the shipped bundle'. Two things contradict this:
- EngineFactory statically imports ConfigurationResolver (src/engine-factory.ts:8) and constructs it as the default (engine-factory.ts:300), so any app that imports EngineFactory still bundles it.
- The CompiledX classes extend Action, EndableAction and TimelineAction, and mixed mode emits plain Actions, so the interpreter loop (action.ts:140-246) ships too.
What is left for bundle size is tree-shaking of unused operations: operation sources plus helpers are about 211 KB of the 585 KB unminified dist/index.mjs (about 144 KB gzip). A tree-shakable `createImporter` plus a `sideEffects` audit delivers that win alone, with no compiler. Eligian's runtime-bundler already emits imports of only the used ops.
- The cost is wildly out of proportion to the measured benefit.
- The stated total is 15 weeks. Realistically it is 25-35: six phases, three new metadata tags with conformance probes across 81 operation files, a JSON-with-offsets parser, a shape lattice with fixpoint, escape analysis, two printers, source maps with Eligian composition, a new runtime ABI, a factory overload, a two-engine differential harness that compares DOM, broadcasts, globals and microtask counts, fast-check fuzzing, and cross-repo Eligian work.
- The payoff is about 0.5 ms saved per execution of an unusually heavy action (583 us to 60 us), and only at action boundaries, never per tick. The 1.1 ms one-time resolver saving per 130 ops is noise next to loading jQuery, locales and the layout template.
For a solo maintainer this is a half-year bet on sub-millisecond wins.

**Major issues**

- The speed comes from re-implementing exactly the quirkiest operations as 'intrinsics': setData (the root parse strips the first character unchecked, set-data.ts:70; it stores `$globaldata` targets by reference), setOperationData (key-order spreads, `override`), setVariable, and when/forEach. Phase 6 then splits six more ops into resolveX/xCore. Every one of these is a second implementation to keep in sync forever, with mandatory property tests per intrinsic.
- Much of the interpreter-vs-compiled gap closes with cheap interpreter fixes, which shrinks B's margin:
- the double deepCopy in setOperationData (action.ts:359, then resolve-property-values.ts:38);
- re-parsing the when expression on every run (when.ts:92), measured at about 6.5 us per call;
- re-splitting, lowercasing and asserting every chain (resolve-external-property-chain.ts:39-47), about 5 us of the 9.5 us per chain-bearing setOperationData call.
B's own Phase 0 adds the when cache 'that narrows the compiler's speed advantage'. Nobody has measured how much of the 583 us is left after these fixes, and the plan does not gate the remaining 13 weeks on that number.
- 'Type-checked output' is mostly theatre. The bag is `TOperationData` with `as IXOperationData` casts at every call site; B admits real output generics would reject `selectElement -> addClass`. What remains is `satisfies` on literals, which duplicates the per-operation JSON schemas (jsonschema/operations/*.json, generated by generate-schemas.ts) and Eligian's type-checker. Typed eventArgs only type the init parameter before the data falls back into the untyped bag.
- Every Layer 1 diagnostic B lists needs only the analysis front end, not codegen, and could ship as a DOM-free `validateConfiguration`/lint in weeks: E101/E102 structure, E110 missing dependency, E111 required, E120 literal unions, E130/E131 when syntax via the pure parseExpression, E140/E141 forbidden segments and `__proto__`, E310 unknown action names. Eligian already does a shallow version (dataflow/operation-dataflow.ts). Coupling these diagnostics to the codegen project delays the most user-visible win behind 6+ weeks of emitter work.
- Public API growth is large, and CLAUDE.md requires a deprecation cycle for any of it to be removed later. It covers:
- the CompiledAction, CompiledEndableAction and CompiledTimelineAction classes;
- readChain, readGlobalChain, loopCollection, annotate, pushScope, setDataWrite and COMPILED_ABI_VERSION/assertCompiledAbi;
- createImporter and the createEngine resolver-factory overload;
- three new metadata fields.
Every future operation also carries a heavier 'Adding an operation' checklist: @resolves, @async and scope tags, conformance probes, and possibly an intrinsic test.
- The CompiledX classes depend on the internal call `_runOperations -> executeOperation(ops, 0, ...)` (action.ts:69), which is implementation detail and not contract. The plan pins it with a spec, but it is the same hidden-coupling risk as Plan A, with far more code on top.
- The compiled resolver needs the eventbus that `IConfigurationResolver.process` does not receive, which forces a factory API change (an overload). The emitted `createResolver` sketch is literally unfinished (`const eventbus = /* captured below */`).

**Minor issues**

- Per-phase estimates ignore cross-repo coordination. Eligian pins eligius 4.0.0 and its own generated 79-op registry would have to move in lockstep (Phase 6).
- Source maps that compose with Eligian onto .eligian lines are the only debuggability gain that matters to DSL authors, and they sit in Phases 4 and 6, behind everything else.
- `sideEffects: false` is useful but independent: an audit plus a smoke bundle, a day or two, and it can ship tomorrow.
- Mode L excludes deopt, so any action with customFunction or a custom op falls back to mode S or the interpreter. In real presentations that use host code the gains shrink, and the corpus has not been scanned to size this.

**What is good**

- It is the only plan that would actually make loop-heavy actions much faster: it targets the real costs the benchmark found (chain parsing, deepCopy, re-parsing when).
- It sets the right drift strategy: shared `walkChain` and parseExpression, the real ConfigurationResolver run in Node with a stub importer, and a conformance check of metadata tags against implementations.
- Its explicit rejections are well argued: no turning the bag into local variables, no inlining of DOM ops, no static binding of requestAction, no removal of unused actions.
- The metadata conformance specs (@erased against the implementation) and `npm run bench` are valuable regardless of whether a compiler is built.
- The diagnostics catalogue (E101-E310) is a good spec for a validator, which is worth building on its own.

## Preferred

Neither as written; a hybrid without codegen first. Take these pieces:
- Plan A's Phase 0 gate and Phase 2 interpreter caches.
- Plan B's Phase 0 shared core (walkChain, cached when AST, the conformance specs and bench).
- Plan B's `createImporter` plus a `sideEffects` audit, for tree-shaking.
- Plan B's diagnostics catalogue, delivered as a DOM-free validator rather than through an emitter.
Postpone codegen behind a measured gate. Plan A builds a compiler with no payoff. Plan B buys real loop speed at a cost the measured, at-boundary-only, sub-millisecond benefit cannot justify, and its bundle claim is false because EngineFactory statically imports ConfigurationResolver (engine-factory.ts:8).

## Should this be built at all?

Not now, at least not the codegen part. The benchmark settles the speed question: about 0.58 ms for a deliberately heavy 13-op action with a 20-item loop, about 60 us without the loop, and execution only at action boundaries, never per tick. The 'constantly creating operation data objects' premise costs about 0.25 us per op. The real cost sits in a few fixable interpreter inefficiencies: the double deepCopy in setOperationData (action.ts:359 plus resolve-property-values.ts:38), re-parsing when on every run (when.ts:92), and re-splitting and re-asserting every chain string (resolve-external-property-chain.ts:39-47).

The other promised wins do not need generated JavaScript:
- Tree-shaking: a minimal importer plus a `sideEffects` audit. The operations and helpers are roughly 36% of the unminified main bundle.
- Startup: about 1 ms, which does not matter.
- Diagnostics: a validator built on metadata and the pure parseExpression.
- Static deployable output: Eligian's bundler already emits engine plus config with only the used ops imported.

Build that half, in about 2-4 weeks. Then build codegen (B's mode-S baseline plus a handful of intrinsics, no TS emit or Eligian composition) only if a real presentation, profiled in a real browser after the interpreter fixes, shows action execution causing visible jank or more than a few ms per boundary.

## Things to cut

- Plan A Phase 1 entirely: the generator-based structural compiler, the WeakMap seam in Action._runOperations, the second 'compiled' vitest project with the `new Function` hook, and the microtask-counting fuzzer. Together they are weeks of work for near-zero user-visible gain.
- Plan A Phase 3 'static output' that ships compiled modules next to the full JSON (it grows the payload). Keep only its minimal-importer half.
- Plan B's TypeScript emit with `satisfies` and casts, and the `--check` tsc integration. It duplicates the JSON schema and Eligian's checker and does not type the data flow.
- Plan B's JSON-with-offsets parser and v3 source-map composition with Eligian, until a user asks for it.
- Plan B Phase 6 resolveX/xCore splits of six more ops, and mid-run deopt: more duplicated semantics for microseconds.
- Plan B's shape lattice and escape analysis as codegen inputs. If kept at all, they belong only inside the validator, for the E110/W151 diagnostics.
- Plan B's resolver-factory overload on createEngine and the CompiledX public classes. They are API surface that would need a deprecation cycle to remove, for an unproven payoff.

## Things missing

- Neither plan measures what is left after cheap interpreter fixes. The deciding number is the 583 us action after: a when-AST cache; a pre-split chain cache; removing the redundant deepCopy in resolvePropertyValues when the input is already a fresh per-execution copy (action.ts:359) or the cached loop copy; and avoiding setOperationData's double spread (set-operation-data.ts:27,40-43).
- No evidence of real workloads. Nobody has profiled a real presentation (Eligian samples, user decks) in a real browser to see how many actions fire per boundary, how large loops get, and whether any of it ever exceeds a frame budget. jsdom numbers overstate DOM costs differently.
- A real bundle-size baseline is missing. dist/index.mjs is 585 KB unminified and about 144 KB gzip, and roughly 211 KB of it is operations plus helpers. Nobody has measured min+gzip with only the ~15 ops a typical deck uses, via a minimal importer and no compiler.
- Neither plan accounts for the ConfigurationResolver staying in every bundle because of the static import at engine-factory.ts:8. Dropping it needs a lazy or default-resolver refactor, which also needs no compiler.
- No comparison with Eligian's existing runtime-bundler (engine + config + selective op imports). That already is the 'static output' the owner describes, so the marginal value of codegen over it is never stated.
- Neither plan costs ongoing maintenance: how 'Adding an operation' in CLAUDE.md grows (Plan B's tags, probes and intrinsics) or how every executeOperation change becomes a two-place change (Plan A).

## Recommendations

- Week 1: `npm run bench` (port the dossier spec), plus a corpus scan of loop sizes, customFunction use and `$scope.newIndex` writes in tests, README examples and Eligian fixtures.
- Weeks 1-2: interpreter fixes, with no semantic change and every existing spec guarding them. Memoise parseExpression per expression string, or per resolved operation (when.ts:92). Pre-parse chain strings once (split, prefix, brackets, suffix, forbidden-segment check) in a bounded cache, keeping the per-read null-intermediate and global-object guards. Drop the redundant deepCopy in resolvePropertyValues where the input is already a private copy. Cache flow-control jump indices per operations array. Re-bench: this likely recovers a large share of the loop gap for every runtime-loaded config.
- Week 2-3: tree-shaking without a compiler. Add an exported `createImporter({operations, controllers, providers, engines, functions, templates, json})`. Audit for import-time side effects, then add `sideEffects: false`. Make EngineFactory's default ConfigurationResolver avoidable, or accept that it stays. Measure min+gzip for a sample deck against EligiusResourceImporter, and hand the importer to Eligian's bundler.
- Week 3-4: a DOM-free `validateConfiguration` in `eligius/metadata` or a new `eligius/lint` entry, implementing Plan B's diagnostics catalogue (E101, E110, E111, E120, E130, E140, E141, E310, W150) with JSON paths, reusing parseExpression and the metadata. Wire it into Eligian. This is the biggest DX win in either plan and needs no emitter.
- Gate: build codegen only if a profiled real presentation, after the fixes above, shows action execution costing more than a few ms per boundary or causing dropped frames. If it passes, build Plan B's Phase 2 mode-S baseline plus the when/forEach and setOperationData/setData intrinsics only. Reuse the shared walkChain, keep JS output, and skip TS satisfies, source-map composition and Phase 6.
- Whatever is built, keep Plan A's discipline: one semantic implementation, a measured gate before every expensive phase, and an asserted zero-fallback counter in tests.

---

# Lens: maintainability

Maintainability, API stability and testing. The questions: how two execution paths (interpreter and compiled) drift apart, whether there is a single source of semantic truth, what a new operation costs, how controllers and custom resources are handled, whether the build entries stay DOM-free, and what versioning and documentation burden falls under CLAUDE.md 'Public API stability'.

## Plan A

Score: 5/10

**Fatal flaws**

- Phase 1 adds a permanent second dispatch implementation but gives the user almost no benefit. _runCompiled re-implements executeOperation's dispatch rules: push for when/forEach, pop after endWhen and before the promise check, newIndex consumption, `?? {}`, and currentIndex at end of list (action.ts:140-246). The generated code also bakes those rules into text inside users' shipped modules. The plan's own Phase 0 predicts '5-15% on loop-heavy actions, about 0 on DOM-bound ones'. The resolver still runs, the importer still ships every operation, and the JSON still ships. So for Phases 1-2 the project pays forever: a `format` integer, a new CLAUDE.md coupling rule, a doubled CI project and a fuzzer. What it gets back is mostly infrastructure. Phase 2, which the plan calls 'the actual speed lever', needs none of Phase 1.
- The Phase 3 tree-shaking deliverable does not work as described. dist/index.mjs:7277 runs `registerOperationTypes(operation_exports);` at module top level. It comes from the side-effect module src/configuration/api/register-operation-types.ts:1-10, pulled in by src/configuration/api/index.ts:4 and re-exported by src/index.ts:4. Any consumer bundle that imports anything from 'eligius', including the plan's minimal importer, therefore keeps the whole operations namespace. `"sideEffects"` cannot fix this, because dist/index.mjs is a single module and bundlers keep top-level calls inside it. A smaller bundle needs an entry-point restructuring: a new runtime entry without register-operation-types, or making the ...ByType registration lazy. The plan does not schedule that, and changing what the main entry registers affects the public API.

**Major issues**

- ICompiledContext (root, p, run, loop, iter, push, pop, deopt, done) is exported from src/index.ts, and generated code in users' repos calls it. Under CLAUDE.md 'Public API changes require a major version bump', every change to it is breaking. The plan treats an independent `format` integer as the escape hatch. A format bump only makes old modules silently fall back to the interpreter under the default 'interpret' policy, which is a hidden performance regression the semver rules do not cover. The context should be internal and versioned, with only an opaque ICompiledActionModule public.
- The default mismatch policy hides drift and goes against CLAUDE.md's 'Invalid configuration must fail fast'. Keys are positional (`timelines[0].timelineActions[3]`). Inserting or reordering one timeline action shifts every later key, the name and signature checks fail, and each affected action quietly runs interpreted after a single console.warn. The pitch claims 'content edits do not need a recompile', but that holds only for edits that leave positions unchanged.
- The test-only auto-compile hook (`__setAutoCompile` plus `new Function`) lives in compiled-body.ts inside the main bundle. That puts a test seam on the production hot path in _runOperations (action.ts:61-88). The compiled vitest project also tests `compilePhase` codegen through the hook, not the shipped path: compiled module file, installCompiledActions, the EngineFactory option, the format check. A test that loads real emitted module files end to end is needed as well.
- The 'existing suite becomes the differential test' idea only compares pass/fail of specs written for the interpreter. Those specs assert outcomes, not traces, so a compiled run that does extra or reordered work with the same final DOM passes. The deopt counter guards against a 'compile nothing' failure, not against subtle ordering drift. Only the fuzzer compares traces and microtask counts, and its chaos ops are custom operations, not the ~80 built-ins.
- The rationale for duplicating the control-flow names in src/compiler/control-flow-names.ts is wrong. ts_dependency_tree on configuration-resolver.ts shows 23 nodes and no jquery: action.ts, when.ts, for-each.ts, parse-expression.ts, globals.ts and the guards. The constants in when.ts and for-each.ts are DOM-free and can be imported directly. Duplicating them adds a drift point with no reason.
- The Phase 2 caches are module-level state (a bounded Map in when.ts, a chain-parse cache), which conflicts with CLAUDE.md 'Avoid global state'. They also need clear rules: cache only successful parses, because error messages embed the operation name taken from scope (assert-safe-property-chain.ts getCurrentOperationName). The plan does not say this.

**Minor issues**

- The generator driver adds generator frames between the engine and the operations. 'Readable stack traces' therefore buys little over today's EngineActionError, which already names action, phase, operation and index (eligius-engine.ts:55-110).
- Guards after every operation make output larger than the JSON it mirrors (the plan estimates 150-250 B per op). Pruning them later needs a maintained list of 'ops that never write newIndex', which is one more thing to drift.
- The tsdown alias list is already out of sync. It has @diagnostics but no @adapters or @locale (tsdown.config.ts:7-25 vs tsconfig). The plan notices this but bundles the fix into a feature PR.
- It hands structural validation (unbalanced when/forEach) to the compiler, but the resolver has no block-balance check at all (grep for endWhen in configuration-resolver.ts finds nothing). Runtime-loaded configs keep crashing with a TypeError at action.ts:156,207.

**What is good**

- One semantic implementation. Generated code calls ops[i].instance from the real resolver output and uses Action's own private helpers (_pushScope, _loopOperationData, copyConfiguredOperationData, withOperationContext, all in action.ts). A bug fix or security fix to any operation or chain guard reaches compiled actions automatically.
- Data-free, signature-only modules. Resolver semantics, placeholders and validation stay on the runtime side, so upgrading eligius changes config resolution consistently for both paths.
- New operations, custom operations, controllers and custom resources need no compiler work: no new metadata tags, no manifest, no intrinsics. The CLAUDE.md 'Adding an operation' workflow is unchanged.
- It hooks in at the resolver output (installCompiledActions after resolver.process, engine-factory.ts:299-304), so it avoids the per-engine eventbus problem that IConfigurationResolver.process (types.ts:520-525) creates for Plan B.
- Deopt accounting, which asserts zero unexpected deopts, correctly identifies 'always-correct fallback hides bugs' as the main testing risk.
- Its own Phase 0 gate admits the speed case is weak.

## Plan B

Score: 3/10

**Fatal flaws**

- Generated metadata becomes load-bearing for code generation, although the dossier shows it is advisory and incomplete. outputProperties exists in only 37 of 79 metadata files. The generator ignores TOperation's output generic (metadata-generator.ts:70-88). @erased is hand-written behaviour with a known mismatch (removePropertiesFromOperationData.propertyNames). The shape lattice built on those tags drives elisions: dropped deletes, the dropped forEach re-merge ('body never writes collection'), and mode L. Mode L passes only the root scope to real operations. If @resolves is missing or wrong on a field such as createElement.text holding '$scope.currentItem.label', the real op resolves against a scope with no currentItem and throws. A wrong `@async never` means a Promise flows on as operation data. So a metadata error, which today only produces a wrong editor hint, becomes a silent miscompile. The plan's guard is a heuristic ts-morph 'conformance scan'. This breaks the single-source-of-truth principle the plan claims to follow.
- Compiled modules freeze runtime semantics at compile time. The module ships resolver output as literals ('Skip ConfigurationResolver'), lowered `when` expressions, and intrinsic bodies for setOperationData, setData, setVariable and the forEach family. When eligius is upgraded without recompiling, resolver changes, fixes to parse-expression/parse-operand, and prototype-pollution or security fixes to those operations do not reach compiled actions (CLAUDE.md Security: 'Guard against prototype pollution'). COMPILED_ABI_VERSION only checks helper signatures, not semantic parity. This creates a permanent second implementation of about 10 operations plus the expression language that must be fixed in two places.
- The headline 'tree-shaken bundle' win (Phase 5 exit: 'measurably smaller') does not work as written. dist/index.mjs:7277 calls `registerOperationTypes(operation_exports)` at top level, from the side-effect import at src/configuration/api/index.ts:4, so every operation is kept by any import from 'eligius'. `"sideEffects": false` does nothing inside one bundled module. Worse, the plan sets it without noticing that register-operation-types.ts is explicitly documented as a 'Side-effect module'. createImporter alone cannot shrink the bundle.

**Major issues**

- The public API grows enormously, and CLAUDE.md requires one major-version deprecation before any of it can be removed. New surface: CompiledAction, CompiledEndableAction and CompiledTimelineAction (new constructor signatures), readChain, readGlobalChain, loopCollection, annotate, pushScope, setDataWrite, setLoopCollection, seedLoopOperationData, createImporter, COMPILED_ABI_VERSION/assertCompiledAbi, an IEngineFactory.createEngine overload (types.ts:180-183), three new IOperationMetadata fields, resolveX/xCore splits of six operations, a diagnostic code catalogue (E101-E310), and the eligius.compile.json manifest format. Each is a maintained contract consumed by generated code in users' repos.
- The emitted TypeScript turns every operation data interface into a build-breaking contract. `satisfies IXOperationData['key']` and imports such as `ICreateElementOperationData<'li'>` (create-element.ts:12 is generic over TTagNames) mean that narrowing a property type, or changing a generic's arity, breaks consumers' builds of generated code. Today that is at most a minor type tweak. The plan also admits the real output generics are wrong for chains (selectElement output is Omit<...> with optional selectedElement, select-element.ts:43-46, while addClass requires it, add-class.ts:7), so it casts everywhere. The user carries the typing risk and gets little typing benefit.
- There are three codegen modes (L, S, G), plus the intrinsics, plus a mid-run deopt in Phase 6. That is a combinatorial test matrix. The example ICompiledOperation descriptors carry no `instance`, yet super.executeOperation calls `operationInfo.instance.call` (action.ts:197-200), so the Phase 6 deopt cannot work with the descriptors as specified. The mode-S snippet's comment ('E402 at compile time is impossible, so a runtime error naming the action') concedes a shipped behaviour divergence for Phases 2-5.
- It contradicts itself about the engine changes. It says 'Action, EndableAction and TimelineAction need no changes', but it lifts the private _pushScope (action.ts:110) and exports the module-private withOperationContext (action.ts:265) as `annotate`. Phase 0 refactors getPropertyChainValue, Phase 6 splits six operation files, and seeding the private _loopOperationData (action.ts:27) is needed for deopt. It also overrides the public executeOperation, whose default `scopeStack = this._scopeStack` parameter is deprecated for removal in the next major (action.ts:14-21,146). Its compiled classes are tied to a signature that is scheduled to change.
- The eventbus capture problem is left unsolved. The plan's own createResolver code contains `const eventbus = /* captured below */`, and the fix it proposes is an API change on IEngineFactory.
- Custom resources need two registrations that will drift: host code registers with EligiusResourceImporter (or the generated createImporter), and the compiler also needs eligius.compile.json with module paths for the same operations, functions, controllers, templates and json.
- Running the real ConfigurationResolver inside the DOM-free compiler is verified possible today (ts_dependency_tree: 23 nodes, no jquery). But it creates a new invariant that is not documented: everything reachable from action.ts, when.ts, for-each.ts, parse-expression, globals and deep-copy must stay jQuery-free forever, or `eligius-compile` breaks in Node. CLAUDE.md names only metadata.ts and configuration-api.ts as DOM-free entries; this widens that boundary to core runtime modules.
- Every new operation now needs @resolves, @async and a derived scope tag, conformance-scan coverage, possibly an intrinsic with a mandatory property test, and possibly an xCore split. The CLAUDE.md 'Adding an operation' list grows from 6 steps to about 10 for every contributor.
- The documentation burden is the largest of the two plans: a new bin with watch mode, a manifest format, diagnostic codes, modes L/S/G, source-map composition, the ABI, and Eligian integration. Eligian pins eligius 4.0.0 and lowers if/for to when/forEach, so cross-repo lockstep becomes mandatory.

**Minor issues**

- A hand-rolled 'JSON with offsets' parser is one more parser to maintain.
- fast-check becomes a new devDependency. Plan B also proposes '2,000 in CI and 50,000 nightly' runs but no nightly CI workflow exists for them.
- 'Every operation spec lifted to a one-op action' is vague. About 80 specs use applyOperation with fixtures and are not mechanically liftable.
- Emitting TS by default puts the cost of the consumer's tsc configuration (NodeNext, Bundler or Node10, per check:types) onto generated code.
- The estimate is about 15 weeks before any user-visible tree-shaking, and that tree-shaking does not work anyway (see fatal flaws).

**What is good**

- It verified that the resolver graph is jQuery-free and reuses the real ConfigurationResolver for compile-time diagnostics. That is the right way to get JSON-path errors without re-implementing validation.
- The shared walkChain and parseExpression core, the when caching, and the pre-split chains are good interpreter improvements in their own right.
- Its differential harness is thorough. It compares DOM, broadcasts, globals, ordered data keys, op traces, error fields, sync-settled and microtask counts, plus a quirks suite with one test per dossier hazard. That harness is reusable no matter which plan is chosen.
- It rejects static binding of requestAction (shared-eventbus semantics, engine-factory.ts:188-196) and removing unused named actions (request-action is public surface).
- Its compile-time diagnostics catalogue is a valuable product even without code generation.

## Preferred

Hybrid, leaning heavily on A, and neither plan as written. Plan A keeps one semantic implementation (the real operations plus Action's own helpers), needs no metadata changes or manifest, and adds no per-operation work for contributors. On maintainability that is decisive. Plan B creates a second implementation of about 10 operations and the expression language, makes advisory metadata load-bearing for codegen, freezes resolver and security semantics into shipped modules, and adds the largest public API surface. Even so, A's Phase 1 is a permanent coupling cost with almost no payoff. The hybrid: take A's Phase 0 and Phase 2 (benchmarks and interpreter caches). Take B's diagnostics as a lint-only front end that runs the real resolver in Node and emits no code. Take B's differential harness as test infrastructure. Fix tree-shaking at the entry-point level. Build A's structural codegen only afterwards, and only if measured real presentations justify it, with ICompiledContext kept internal.

## Should this be built at all?

Not as a code generator now. The measured absolute overhead is small: about 0.58 ms for a heavy 13-op, 20-iteration action and about 60 us without loops. Actions run only at range boundaries, and the benchmark puts most of the cost in chain parsing, resolvePropertyValues/deepCopy and re-parsing `when`. Interpreter caches remove most of that with zero drift risk. The other promised wins do not need codegen. (1) Tree-shaking is blocked by the top-level registerOperationTypes in dist/index.mjs:7277 and by the importer's `import * as ops`, and the fix is a new runtime entry or lazy registration plus a createImporter, not a compiler. (2) Compile-time diagnostics can be a DOM-free `eligius/lint` that reuses the real resolver, and the structural checks belong in the resolver itself, since CLAUDE.md requires that invalid configuration fail fast with a JSON path and today unbalanced blocks crash at action.ts:156,207. (3) Error messages already name action, phase, operation and index through EngineActionError. A second execution path in a single-maintainer project doubles the semantic surface every future operation, fix and security patch has to respect. Build the cheap wins first. Revisit codegen only if real presentations, not synthetic loops, show the interpreter in a profile.

## Things to cut

- Plan B: the shape lattice that drives elisions (keep it only for warnings), mode L, scalar scope locals, and the intrinsics for setOperationData, setData and setVariable. These are the drift generators.
- Plan B: shipping resolved configuration as literals ('skip ConfigurationResolver'). It saves about 1.1 ms per 130 ops and freezes resolver semantics into user artifacts.
- Plan B: emitted TypeScript with `satisfies` against every I*OperationData interface. It turns internal type tweaks into consumer build breaks.
- Plan B: the eligius.compile.json manifest, the hand-rolled JSON-offset parser, the Phase 6 resolveX/xCore splits of six operations, and the mid-run deopt.
- Plan B: `"sideEffects": false`. It is useless for a single bundled dist file and contradicts the documented side-effect module register-operation-types.ts.
- Plan A: the test-only `__setAutoCompile`/`new Function` hook in the production Action module. Test with real emitted modules loaded through vitest instead.
- Plan A: the duplicated control-flow name constants. Import them from when.ts and for-each.ts, which are verified DOM-free.
- Both: the 'readable stack traces' selling point. EngineActionError already carries this information.

## Things missing

- Neither plan notices that dist/index.mjs:7277 runs `registerOperationTypes(operation_exports)` at top level, from src/configuration/api/index.ts:4, which defeats any minimal-importer tree-shaking. A runtime entry without that side effect, or lazy registration, is a prerequisite and must be versioned as a public API decision.
- Structural validation of when/endWhen and forEach/endForEach balance in ConfigurationResolver itself. It does not exist today, and adding it is a behaviour change: a warning in a minor, an error in the next major.
- A semver policy for compiled artifacts. Which eligius upgrades require a recompile, how users find out, and whether a silent interpreted fallback counts as a regression. A CI-friendly `--verify` mode that fails on any mismatch.
- A documented invariant, with a node-environment spec, that the action/resolver/helper graph stays jQuery-free if the compiler imports it. Today only metadata.ts and configuration-api.ts are guarded.
- Making ICompiledContext (A) or the helper ABI (B) @internal, so generated-code helpers do not fall under the 'Deprecate for one major version' rule.
- Coverage configuration: whether generated code and src/compiler count toward coverage, and how a doubled CI run fits the existing test:ci budget.
- An update to the CLAUDE.md 'Adding an operation' / 'Adding an event' checklists describing compiler obligations, plus TypeDoc and README ownership for the new entry.
- A plan for coordinating with Eligian: it pins eligius 4.0.0 and has its own bundler (runtime-bundler.ts) that emits engine plus config. Without that, there will be two divergent 'static output' stories.

## Recommendations

- Do now, with no compiler: memoise parsed `when` expressions and parsed chain segments (successful parses only) and cache the block-index lookups per operations array. Commit the benchmark as `npm run bench`. Re-measure.
- Fix bundle size at the entry level. Introduce a runtime entry (or make the ...ByType registration lazy) so that importing EngineFactory/EligiusEngine does not retain every operation through dist/index.mjs:7277. Add a tree-shakable createImporter. Measure with a real bundler before claiming anything.
- Ship `eligius/lint` (DOM-free) that runs the real ConfigurationResolver with a metadata-backed stub importer plus structural, when-syntax, forbidden-segment and literal-union checks, reporting JSON paths. Move the structural checks into the resolver as warnings now and errors in the next major.
- Adopt Plan B's differential harness and quirks suite as permanent tests of the interpreter itself. They are valuable even if no compiler is ever built.
- Only if profiles of real presentations still justify it: build Plan A's structural codegen with ICompiledContext marked @internal, mismatch policy 'throw' in CI builds, keys that are robust to reordering (action id where present), and end-to-end tests that load emitted module files rather than a `new Function` hook.
- Never make metadata tags load-bearing for codegen unless a conformance test proves them from the implementation (runtime probes through applyOperation, not only AST scans), and never inline an operation body. Call the real function so fixes propagate.

---

