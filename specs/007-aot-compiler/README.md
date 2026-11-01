# 007: ahead-of-time compiler for Eligius configurations

Research and planning output, 2026-11-01. Not yet a speckit spec.

- [roadmap.md](roadmap.md): the decision and phased plan. Start here.
- [measurements.md](measurements.md): Phase 0 results (benchmark, real-browser profile, bundle baseline, corpus scan) and how they read against gate G1.
- [phase-0/](phase-0/): the scripts and raw results behind measurements.md.
- [critiques.md](critiques.md): three adversarial reviews of the candidate plans.
- [plans.md](plans.md): the two candidate plans (minimal vs complete).
- [research.md](research.md): code dossier and the interpreter benchmark.

All 8 open decisions were resolved on 2026-11-01; see roadmap.md section 11.

Verdict: Go with conditions. Build the interpreter fast paths, the bundle-size fix, the `eligius/lint` validator and the differential test harness now. The code generator is technically feasible, but it gets built only if gate G1 passes: after the interpreter fixes, a real presentation profiled in a real browser must still spend measurable time in action execution.

Estimate: About 5-6 weeks for Phases 0-3 (measurement, interpreter fast paths, tree-shakable runtime entry, eligius/lint), for one developer with an AI assistant. If gate G1 passes, Phases 4-5 (guarded codegen, intrinsics, CLI) add about 3.5-4 weeks, for 9-10 weeks in total.

Status (2026-11-01): closed at Phase 3 on branch feat/aot-compiler-phase-0. Phases 0 to 3 shipped (measurements, interpreter fast paths with the quirks and differential suites, createImporter and eligius/runtime, eligius/lint and resolver structural warnings). Gate G1 was measured (measurements.md section 9): the interpreter is 1 percent of action time in the real presentation, and the owner chose not to build compiled output. Phases 4 and 5 (codegen) are not built.

First action (done): Port the dossier's temporary benchmark into src/test/bench/action-overhead.bench.ts and add an `npm run bench` script (vitest bench). Include the "direct-call ceiling" variant: hand-written structured if/for that calls the real operation functions with real pushed scopes. Run it and record the four numbers in specs/007-aot-compiler/measurements.md.

Rerun: Workflow `.claude/workflows/aot-compiler-plan.js` with args `{"date": "..."}`.
