# Reference interpreter (pinned)

A verbatim copy of the action runner, the control-flow and data operations and
the property-chain helpers as they were at commit `d937f6be`, before the Phase 1
optimisations of [specs/007-aot-compiler](../../../../specs/007-aot-compiler/roadmap.md).
Imports between the copied files point at each other; everything else (types,
`deepCopy`, the globals store, `removeProperties`) is the live module, because
Phase 1 does not change it.

`interpreters.ts` exposes both interpreters, `quirks.spec.ts` pins the
behaviours the dossier flagged as easy to break, and `differential.spec.ts`
fuzzes generated operation lists through both and requires identical results.

Do not edit these files. Regenerate them only when a later phase intentionally
moves the reference point, and delete the directory after Phase 4.
