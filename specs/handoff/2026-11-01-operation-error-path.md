# Hand-off: the full operation path on engine action errors

Date: 2026-11-01
From: Eligian, branch `fix/audit-high-findings` (commit `0cc9f13`)
Status in Eligian: works around the gap. It reports every matching place and is ready to use an exact path once Eligius provides one. Eligian pins `eligius@4.0.0`.

## What Eligius reports today

`withOperationContext` (`src/action/action.ts`) gives a failing error the system name and index of the operation that failed, and leaves it alone in every enclosing action ("the innermost operation is the most specific"). `EngineActionError` (`src/eligius-engine.ts`, `readOperationContext`) copies those two fields and adds the id of the timeline action the engine started or ended.

So for a failure inside a called action the error carries:

- `actionId`: the outer timeline action;
- `operationSystemName` / `operationIndex`: the inner action's operation and its index in **the inner action's** list.

Nothing says which action on the call chain the index belongs to.

## Why this concerns Eligian

Eligian maps engine errors back to the `.eligian` source (`locateEngineError` in `packages/language/src/compiler/eligian-map.ts`). The preview uses this for its runtime diagnostics and `eligian smoke` uses it for its reports. It looks for the reported name at the reported index in the timeline action, then in every action it calls (`requestAction` + `startAction` / `endAction`, recursively).

That is ambiguous whenever two actions on the chain have the same operation at the same index. This is common, because most action bodies start with `selectElement`:

```
action inner() [ getControllerInstance("NoSuchController") ]
timeline "t" in "#stage" using raf {
  at 0s..5s [
    getControllerInstance("LabelController")   // index 0 of the timeline action
    inner()                                     // requestAction(inner), startAction
  ]
}
```

The engine reports `getControllerInstance` at index 0. The timeline action's own operation 0 and `inner`'s operation 0 both match, and only `inner`'s failed. Eligian now points at the first match and lists the others ("Or here (in 'inner')"), but it cannot know which one is right. A real-engine test in Eligian reproduces this (`eligian-map.spec.ts`, "an error in a called action at an index the caller shares").

## Proposed change in Eligius

Add the whole path, outermost first, without changing the meaning of the existing fields.

1. Extend `IOperationErrorContext` with

   ```ts
   operationPath?: {systemName: string; index: number}[];
   ```

2. In `withOperationContext`, always prepend `{systemName: operation.systemName, index}` to `annotated.operationPath` (create the array when absent). Do this also when `operationSystemName` is already set. `operationSystemName` / `operationIndex` keep meaning "the innermost operation".
3. Copy `operationPath` in `readOperationContext` onto `EngineActionError`, and add it to `IEngineActionError` as `readonly operationPath?: readonly {readonly systemName: string; readonly index: number}[]`. Document it there:
   - entry 0 is the failing timeline action's own operation, for a nested failure its `startAction` / `endAction`;
   - each further entry is in the action the previous entry started;
   - the last entry is the failing operation, the same as `operationSystemName` / `operationIndex`.
4. Add it to the `engine-error` event metadata (`src/eventbus/events/metadata/engine-error.ts`) if the generated docs list the error's fields.
5. CHANGELOG: a new `## 4.2.0` section (4.1.0 is released) → `### Added`. The field is additive, so a minor release.

With the path, Eligian follows it exactly. For each entry before the last, the `requestAction` just before that `startAction` / `endAction` names the next action. `alternatives` stays only as the fallback for older Eligius versions.

## Tests worth having

1. Direct failure: `[selectElement, getControllerInstance("Nope")]` reports `operationPath` `[{getControllerInstance, 1}]`.
2. Nested failure: a timeline action `[selectElement, requestAction(inner), startAction]` where `inner`'s operation 0 throws reports `[{startAction, 2}, {<inner op>, 0}]`, with `operationIndex` still 0.
3. Two levels deep (`outer` calls `middle` calls `inner`): three entries, outermost first.
4. Async: an operation in `inner` that returns a rejecting promise. This takes the `asyncOperation` / `asyncIndex` branch of `executeOperation`. Also cover a failure after an earlier async operation in the same list (the continuation runs in a new `executeOperation` call). Each action frame must add exactly one entry.
5. The end phase: a failure in `inner`'s end operations through `endAction`.
6. A failure inside a `forEach` body: the index is the operation's index in the action's flat list, as today.

## Things to keep in mind

- The field is additive and optional, so it is not a breaking change. Eligian treats a missing `operationPath` as "older Eligius" and keeps its current matching.
- Errors that are not `Error` instances are already wrapped by `withOperationContext`. The path lives on that wrapper, like the other two fields.
- If an error object is reused or rethrown through the same frame twice, the path would get a duplicate entry. Test 4 should catch that.

## Where to look in Eligius

- `src/action/action.ts`: `executeOperation` (sync loop, async branch, `catch`), `IOperationErrorContext`, `withOperationContext`
- `src/eligius-engine.ts`: `EngineActionError`, `readOperationContext`
- `src/types.ts`: `IEngineActionError`
- `src/eventbus/events/metadata/engine-error.ts`
- the existing tests for the innermost-operation behaviour (search the tests for `operationIndex`)
