export const meta = {
  name: 'aot-compiler-plan',
  description: 'Research, plan, adversarially critique and roadmap an ahead-of-time compiler that turns Eligius configurations into JavaScript',
  whenToUse: 'Feature research for the Eligius AOT compiler idea. Pass args {date}. Main agent writes the resulting files into specs/007-aot-compiler/ from the returned data.',
  phases: [
    {title: 'Research', detail: '4 Sonnet code readers + 1 Sonnet benchmark of interpreter overhead', model: 'sonnet'},
    {title: 'Plan', detail: '2 Opus planners with opposite angles (minimal vs ambitious)', model: 'opus'},
    {title: 'Critique', detail: '3 Opus adversarial critics with distinct lenses', model: 'opus'},
    {title: 'Roadmap', detail: '1 Opus synthesizer merges plans and critiques into a roadmap', model: 'opus'},
  ],
}

const today = (args && args.date) || 'unknown date'
const ROOT = 'F:\\projects\\eligius\\eligius'

const IDEA = `
THE FEATURE IDEA (from the project owner, verbatim in spirit):
Eligius is a runtime engine that consumes a JSON configuration describing timelines, actions and operations.
Executing it means constantly creating and updating operation data objects and passing them from operation to
operation, plus interpreting control flow (when/otherwise/endWhen, forEach/endForEach/break/continue, startAction/endAction).
Proposal: build an ahead-of-time COMPILER that generates real JavaScript (or TypeScript) code for each configured action,
so that a presentation can ship as static code instead of a config interpreted at runtime.
This does NOT replace the runtime engine or the configuration format; loading and running a config at runtime stays valuable.
It is an additional output mode for presentations that are static.

HYPOTHESES TO TEST, NOT CONCLUSIONS (raised by the assistant before this workflow):
H1. The interpreter overhead may be small in practice: operations run at action boundaries, not every tick; the tick cost is range checks.
    The surest wins may be elsewhere: tree-shaking unused operations, skipping ConfigurationResolver at startup, readable stack traces, type-checked output.
H2. Only the action/operation layer compiles away. Timeline scheduling, position sources, eventbus, controllers and locale stay runtime.
    Output would be "engine runtime + generated action modules", not a standalone bundle.
H3. Runtime-dynamic values stay dynamic: property chains into globals or event args, loops over runtime arrays, "when" on runtime values
    compile to real JS (if/for/direct property access) but the values are still resolved at runtime.
`

const RULES = `
Working rules: repo root is ${ROOT}. Use Windows backslash paths with the file tools. Run npm through PowerShell exactly as CLAUDE.md says.
Do NOT modify tracked files. Do not commit. Prefer the ts_* navigation tools for TypeScript questions, then read the files you need in full.
Cite every claim with file:line. Your final text IS the return value: return the structured output, nothing else.
`

// ---------------------------------------------------------------- schemas
const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    area: {type: 'string'},
    summary: {type: 'string', description: 'What this subsystem does, 1-3 paragraphs'},
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: {type: 'string'},
          detail: {type: 'string', description: 'Precise description with file:line citations'},
          static_or_dynamic: {type: 'string', description: 'Whether a compiler could resolve this at compile time, at runtime only, or partially; explain'},
        },
        required: ['topic', 'detail', 'static_or_dynamic'],
      },
    },
    compiler_implications: {type: 'array', items: {type: 'string'}, description: 'What a compiler MUST reproduce or can eliminate here'},
    hazards: {type: 'array', items: {type: 'string'}, description: 'Semantics that are easy to get subtly wrong when compiling'},
    hypothesis_verdicts: {type: 'string', description: 'Evidence for or against H1/H2/H3 from this area, with citations'},
    open_questions: {type: 'array', items: {type: 'string'}},
  },
  required: ['area', 'summary', 'findings', 'compiler_implications', 'hazards', 'hypothesis_verdicts', 'open_questions'],
}

const BENCH_SCHEMA = {
  type: 'object',
  properties: {
    ran: {type: 'boolean'},
    method: {type: 'string', description: 'Exactly what was measured and how, including the scenarios and iteration counts'},
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          scenario: {type: 'string'},
          interpreted_us_per_run: {type: 'number'},
          handwritten_us_per_run: {type: 'number'},
          ratio: {type: 'number'},
          notes: {type: 'string'},
        },
        required: ['scenario', 'interpreted_us_per_run', 'handwritten_us_per_run', 'ratio'],
      },
    },
    where_time_goes: {type: 'string', description: 'Which parts of the interpreter dominate (resolvePropertyValues, deepCopy, scope bookkeeping, promise chaining, ...), with evidence'},
    conclusion: {type: 'string'},
    caveats: {type: 'array', items: {type: 'string'}},
    cleanup_verified: {type: 'boolean', description: 'true only if git status shows no tracked changes and your temporary files are deleted'},
  },
  required: ['ran', 'method', 'results', 'where_time_goes', 'conclusion', 'caveats', 'cleanup_verified'],
}

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: {type: 'string'},
    angle: {type: 'string'},
    one_paragraph_pitch: {type: 'string'},
    goals: {type: 'array', items: {type: 'string'}},
    non_goals: {type: 'array', items: {type: 'string'}},
    architecture: {type: 'string', description: 'Markdown. Packages/entries, pipeline stages (parse, resolve, analyse, lower, emit), where it lives in the repo, how it reuses ConfigurationResolver and the generated metadata'},
    compilation_model: {type: 'string', description: 'Markdown. What a compiled action looks like: show a concrete JSON action and the exact generated code for it, including when/otherwise, forEach, erased properties, async operations, property chains, startAction, event actions'},
    runtime_contract: {type: 'string', description: 'Markdown. What the engine runtime must expose for compiled output, which engine/API changes are needed, how compiled actions plug into EligiusEngine/EngineFactory, and how a mixed mode (some compiled, some interpreted) would or would not work'},
    type_strategy: {type: 'string', description: 'Markdown. Emit TS or JS, how operation data types are tracked through the chain using @dependency/@required/@erased metadata, what compile errors become possible'},
    testing_strategy: {type: 'string', description: 'Markdown. Differential testing interpreter vs compiled, fixtures, how to keep the two from drifting'},
    phases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          deliverables: {type: 'array', items: {type: 'string'}},
          exit_criteria: {type: 'string'},
          estimate: {type: 'string', description: 'In concrete units, e.g. "3 days for one developer with an AI assistant"'},
        },
        required: ['name', 'deliverables', 'exit_criteria', 'estimate'],
      },
    },
    risks: {type: 'array', items: {type: 'string'}},
    open_decisions: {type: 'array', items: {type: 'string'}},
  },
  required: ['title', 'angle', 'one_paragraph_pitch', 'goals', 'non_goals', 'architecture', 'compilation_model', 'runtime_contract', 'type_strategy', 'testing_strategy', 'phases', 'risks', 'open_decisions'],
}

const VERDICT = {
  type: 'object',
  properties: {
    score: {type: 'number', description: '1 (do not build) to 10 (build as written)'},
    fatal_flaws: {type: 'array', items: {type: 'string'}, description: 'Things that make the plan not work as written, each with the evidence from the codebase'},
    major_issues: {type: 'array', items: {type: 'string'}},
    minor_issues: {type: 'array', items: {type: 'string'}},
    what_is_good: {type: 'array', items: {type: 'string'}},
  },
  required: ['score', 'fatal_flaws', 'major_issues', 'minor_issues', 'what_is_good'],
}

const CRITIQUE_SCHEMA = {
  type: 'object',
  properties: {
    lens: {type: 'string'},
    plan_a: VERDICT,
    plan_b: VERDICT,
    preferred: {type: 'string', description: '"A", "B", "hybrid" or "neither", with the reason'},
    should_this_be_built_at_all: {type: 'string', description: 'Honest answer with reasoning; "no" is an acceptable answer'},
    things_to_cut: {type: 'array', items: {type: 'string'}},
    things_missing: {type: 'array', items: {type: 'string'}},
    recommendations: {type: 'array', items: {type: 'string'}},
  },
  required: ['lens', 'plan_a', 'plan_b', 'preferred', 'should_this_be_built_at_all', 'things_to_cut', 'things_missing', 'recommendations'],
}

const ROADMAP_SCHEMA = {
  type: 'object',
  properties: {
    go_no_go: {type: 'string', description: '"go", "go with conditions" or "no-go", one sentence of reason'},
    decision_summary: {type: 'string', description: 'Markdown, under 300 words: what was chosen from which plan, what the critics killed, what remains open'},
    roadmap_markdown: {type: 'string', description: 'The COMPLETE roadmap document in Markdown, ready to save as specs/007-aot-compiler/roadmap.md. Sections: Summary, Decision record (what the critics changed), Goals and non-goals, Architecture, Compilation model with the concrete code example, Runtime contract and engine changes, Type strategy, Testing strategy, Phased implementation plan (each phase: deliverables, files to create or change, exit criteria, estimate), Risks and mitigations, Open decisions for the project owner, Measurement plan (how to prove the benefit). Cite file:line where it helps.'},
    estimated_total: {type: 'string'},
    first_action: {type: 'string', description: 'The single smallest first step a developer can take, under one day'},
  },
  required: ['go_no_go', 'decision_summary', 'roadmap_markdown', 'estimated_total', 'first_action'],
}

// ---------------------------------------------------------------- research
const AREAS = [
  {
    key: 'execution-model',
    brief: `AREA: the action and operation execution model.
Read in full: src/action/action.ts, src/action/endable-action.ts, src/action/timeline-action.ts, src/action/types.ts, src/operation/types.ts,
src/operation/helper/loop-jump.ts, src/operation/helper/find-matching-operation-index.ts, and the control-flow operations
src/operation/when.ts, otherwise.ts, end-when.ts, for-each.ts, end-for-each.ts, break-for-each.ts, continue-for-each.ts, start-action.ts, end-action.ts, request-action.ts (and any others you find that manipulate IOperationScope.newIndex or the loop fields).
Questions: exactly how is an operation chain executed (sync vs promise chaining, how operationData is copied or mutated between operations, how
the scope object is created and which fields change per step)? How do jumps (newIndex) work? What happens when an operation throws or rejects?
What does start vs end of an EndableAction share? How are TimelineActions started and ended by the engine (read the relevant parts of src/eligius-engine.ts)?
What are the semantics a compiler would need to reproduce exactly: evaluation order, data copying, scope fields read by non-control-flow operations (grep for "this." across src/operation/*.ts and list every scope field each operation reads or writes)?`,
  },
  {
    key: 'data-resolution',
    brief: `AREA: operation data resolution, i.e. everything that turns configuration values into runtime values.
Read in full: src/operation/helper/resolve-property-values.ts, resolve-property-chain.ts, resolve-external-property-chain.ts, get-property-chain-value.ts,
internal-resolve.ts, assert-safe-property-chain.ts, parse-expression.ts, parse-operand.ts, globals.ts, set-global.ts, remove-global.ts,
resolve-event-arguments.ts, merge-operation-data.ts, remove-operation-properties.ts, deep-copy.ts, and the operations that use them most
(src/operation/when.ts, set-data.ts, set-global-data.ts, get-global-data.ts, calc.ts, set-operation-data.ts, custom-function.ts, get-import.ts and whatever else references these helpers).
Questions: what syntaxes exist in configuration values ("operationdata.x", "globaldata.x", "context.x", "$" prefixes, "@" prefixes, function references, template strings; find the real list)?
For each syntax: can it be resolved at compile time, or only at runtime, or partially (the path is static but the value is runtime)?
How does the "when" expression grammar work and could it be lowered to a JS expression? Which values are deep-copied and when?
What does @erased mean at runtime (grep "delete (operationData" and similar)? Where could prototype-pollution guards be dropped in compiled code and where not?`,
  },
  {
    key: 'config-to-engine',
    brief: `AREA: the path from JSON configuration to a running engine, and the engine's runtime contract.
Read in full: src/configuration/types.ts, src/configuration/configuration-resolver.ts, src/configuration/timeline-provider-overrides.ts, src/engine-factory.ts,
src/importer/*.ts, src/index.ts, src/metadata.ts, src/configuration-api.ts, src/types.ts, tsdown.config.ts, package.json (exports, scripts), and the parts of src/eligius-engine.ts
that consume the resolved configuration (init actions, event actions, timeline actions, action lookup by name for startAction/requestAction, language/locale wiring).
Questions: what exactly does IResolvedEngineConfiguration contain and which parts of it are functions/classes vs data? What does the engine need from the resolved
config at runtime (list every property access)? Could a generated module construct an IResolvedEngineConfiguration directly, skipping the resolver and the importer?
How are custom operations, functions, controllers, templates and json registered through EligiusResourceImporter, and how would generated code import them instead?
What are the published entry points and build pipeline, and where would a compiler entry (DOM-free, Node-runnable) and a compiled-runtime entry fit?
What public API changes would compiled output need, and which of them are breaking under the project's API stability rules?`,
  },
  {
    key: 'tooling-and-prior-art',
    brief: `AREA: existing code generation tooling, metadata, and prior art.
Read in full: everything in src/tools/ (the metadata generators, schema generator, readme generator), the generated metadata types in src/operation/metadata/types.ts,
src/controllers/metadata/types.ts, src/eventbus/events/metadata/types.ts, and a few generated metadata files (run "npm run metadata" first if the generated dirs are missing).
Also read src/configuration/api/*.ts (the fluent ConfigurationFactory) and skim specs/main/*.md and specs/*/spec.md for anything about compilation, performance or an "Eligian" DSL.
Check whether the Eligian DSL repository exists locally at F:\\projects\\eligian (list it; if present read its README and find how it emits Eligius configuration). If it is absent, note that and use the GitHub README at https://github.com/rolandzwaga/eligian via the web-fetch agent or WebFetch if available.
Questions: what does the operation metadata already know (parameter types, dependencies, erased properties, outputs)? Is it enough to type-check an operation chain statically?
Which parts of the ts-morph tooling could a compiler reuse? Where would a compiler fit relative to Eligian (Eligian -> JSON -> compiled JS, or Eligian -> compiled JS directly)?
Briefly compare with how other config/DSL-driven frameworks moved to AOT (Angular Ivy, Svelte, Solid, Lottie-to-code tools, XState's typegen) and what lessons transfer; keep this part to a few paragraphs.`,
  },
]

const BENCH_BRIEF = `AREA: measure the actual interpreter overhead to test hypothesis H1 with numbers.
First look for existing benchmarks (grep for "bench" in src/ and package.json; the audit memory mentions a benchmark spec once existed).
Then write ONE temporary Vitest spec file at src/test/unit/aot-overhead.tmp.spec.ts (so path aliases resolve) that:
1. Builds a representative action with the real Action class (use src/test/fixtures/action-factory.ts and eventbus-factory.ts) containing about 8 to 12 operations:
   selectElement, addClass/removeClass, setData, a when/otherwise/endWhen block, a forEach over a 20-item array with 2 operations inside, and one setOperationData with property-chain references.
   Use jsdom elements from the test environment; keep the DOM work identical between the two variants.
2. Writes the hand-written JavaScript equivalent of that action: a plain async function that calls the same operation functions directly (or the same jQuery calls) with if/for.
3. Times both with performance.now() over enough iterations (warm up 200, then measure 2000 or more; report microseconds per run), three scenarios: full action; the same without the forEach; the same without the when block.
4. Also measures the one-time cost of ConfigurationResolver.resolve on a small real configuration (build one with ConfigurationFactory or borrow a fixture from src/test/) versus constructing the resolved object directly.
Run it with: powershell.exe -Command "cd '${ROOT}' ; npx vitest run src/test/unit/aot-overhead.tmp.spec.ts" (adjust to the config in src/vitest.config.ts if needed).
Report the numbers, where the time goes (add a few extra measurements if needed to attribute it: resolvePropertyValues alone, deepCopy alone, the promise chain alone).
Then DELETE the temporary spec file and confirm with git status that no tracked file changed. If the benchmark cannot be made to run after three honest attempts, report ran=false and say why.`

phase('Research')
log('Research: 4 Sonnet readers + 1 Sonnet benchmark')
const researchCalls = AREAS.map(a => () =>
  agent(`${IDEA}\n${RULES}\nDate: ${today}.\nYou are one of several researchers preparing the design of this compiler. ${a.brief}\nBe exhaustive about semantics: a later planner will design code generation from your report alone, so include the small details (ordering, mutation vs copy, error behaviour).`,
    {label: `research:${a.key}`, phase: 'Research', model: 'sonnet', schema: RESEARCH_SCHEMA})
    .then(r => r && {...r, key: a.key}))
researchCalls.push(() =>
  agent(`${IDEA}\n${RULES}\nDate: ${today}.\n${BENCH_BRIEF}`,
    {label: 'research:benchmark', phase: 'Research', model: 'sonnet', schema: BENCH_SCHEMA})
    .then(r => r && {...r, key: 'benchmark'}))

const researchRaw = await parallel(researchCalls)
const research = researchRaw.filter(Boolean)
const bench = research.find(r => r.key === 'benchmark') || null
const reports = research.filter(r => r.key !== 'benchmark')
log(`Research done: ${reports.length}/4 reports, benchmark ${bench ? (bench.ran ? 'ran' : 'did not run') : 'missing'}`)

const RESEARCH_DOSSIER = `
RESEARCH DOSSIER (written by Sonnet researchers who read the code; trust citations, verify anything surprising yourself):
${reports.map(r => `\n=== ${r.key} ===\n${JSON.stringify(r, null, 1)}`).join('\n')}

=== benchmark ===
${bench ? JSON.stringify(bench, null, 1) : 'The benchmark agent failed; treat H1 as untested.'}
`

// ---------------------------------------------------------------- plan
phase('Plan')
const PLANNER_COMMON = `${IDEA}\n${RULES}\nDate: ${today}.\n${RESEARCH_DOSSIER}
You are designing the compiler. Verify the dossier's key claims against the code before relying on them (open the cited files).
Produce a complete, concrete plan. The compilation_model section MUST contain a real JSON action from the codebase's style and the exact code your compiler would emit for it.
Address H1, H2 and H3 explicitly: what the compiler eliminates, what it keeps at runtime, and what the measured numbers say about the benefit.
Estimates are for one experienced developer working with an AI coding assistant; give them in days or weeks.`

const PLAN_ANGLES = [
  {
    key: 'A',
    angle: 'MINIMAL AND INCREMENTAL. Smallest compiler that ships value: generated modules that import the existing operation functions and call them directly with native control flow, reusing ConfigurationResolver outputs and the existing metadata. No new type system. Optimise for shipping something testable in weeks and for zero drift from the interpreter. Decide what the generated module exports and how EngineFactory consumes it with the least API change.',
  },
  {
    key: 'B',
    angle: 'AMBITIOUS AND COMPLETE. A proper compiler pipeline (parse, resolve, analyse, lower to an IR, optimise, emit) that produces type-checked TypeScript, tracks operation-data shapes through the chain with the @dependency/@required/@erased metadata, inlines or specialises operations where safe, eliminates property-chain string parsing, dead-code-eliminates unused operations and controllers, and emits source maps back to the JSON path. Also consider whether Eligian should target this compiler directly. Be ambitious but every feature must be justified against the codebase and the benchmark.',
  },
]

const plans = (await parallel(PLAN_ANGLES.map(p => () =>
  agent(`${PLANNER_COMMON}\nYOUR ANGLE (${p.key}): ${p.angle}`,
    {label: `plan:${p.key}`, phase: 'Plan', model: 'opus', effort: 'high', schema: PLAN_SCHEMA})
    .then(r => r && {...r, key: p.key})))).filter(Boolean)
log(`Plans produced: ${plans.map(p => p.key).join(', ') || 'none'}`)
if (plans.length === 0) return {error: 'no plans produced', research, bench}

const planA = plans.find(p => p.key === 'A')
const planB = plans.find(p => p.key === 'B')
const PLANS_TEXT = `
=== PLAN A (minimal, incremental) ===
${planA ? JSON.stringify(planA, null, 1) : 'MISSING: planner A failed'}

=== PLAN B (ambitious, complete) ===
${planB ? JSON.stringify(planB, null, 1) : 'MISSING: planner B failed'}
`

// ---------------------------------------------------------------- critique
phase('Critique')
const LENSES = [
  {
    key: 'semantics',
    lens: 'SEMANTIC EQUIVALENCE AND FEASIBILITY. Your job is to find where compiled output would behave differently from the interpreter: evaluation order, operation data copying vs mutation, erased properties, async ordering and error propagation, scope fields operations read, startAction/requestAction/event actions, loops with break/continue, nested when, runtime-only property chains, globals, locale changes. For every claimed difference, open the code and cite file:line. Also judge whether each plan\'s emitted code example is actually correct against the real operation signatures.',
  },
  {
    key: 'value',
    lens: 'VALUE, COST AND SCOPE. Assume the owner has limited time. Use the benchmark numbers and the codebase to judge what users would really gain (speed, bundle size, startup, debuggability, type safety) and whether a smaller change (for example optimising the interpreter, caching resolved property chains, pre-resolving configs at build time without codegen) would deliver most of the value. Attack the estimates. Say plainly whether the feature is worth building, and if so, which half of it.',
  },
  {
    key: 'maintainability',
    lens: 'MAINTAINABILITY, API STABILITY AND TESTING. Two execution paths (interpreter and compiler) will drift. Judge each plan\'s strategy against that: differential testing, shared lowering, metadata as the single source of truth, how new operations get compiler support, how controllers and custom resources are handled, build pipeline and entry points (metadata.ts and configuration-api.ts must stay DOM-free), versioning under the project\'s public-API rules, documentation burden. Cite the project rules and code.',
  },
]

const critiques = (await parallel(LENSES.map(l => () =>
  agent(`${IDEA}\n${RULES}\nDate: ${today}.\n${RESEARCH_DOSSIER}\n${PLANS_TEXT}
You are an ADVERSARIAL critic. Your lens: ${l.lens}
Assume both plans are flawed and prove it with evidence from the code. A plan that survives you should deserve it. Do not soften findings.
Score each plan 1-10, name fatal flaws separately from major and minor issues, and say which plan (or hybrid, or neither) you prefer and whether the feature should be built at all.`,
    {label: `critique:${l.key}`, phase: 'Critique', model: 'opus', effort: 'high', schema: CRITIQUE_SCHEMA})
    .then(r => r && {...r, key: l.key})))).filter(Boolean)
log(`Critiques: ${critiques.map(c => `${c.key} A=${c.plan_a.score} B=${c.plan_b.score} pref=${c.preferred.split(/[ ,.]/)[0]}`).join(' | ')}`)

// ---------------------------------------------------------------- roadmap
phase('Roadmap')
const roadmap = await agent(`${IDEA}\n${RULES}\nDate: ${today}.\n${RESEARCH_DOSSIER}\n${PLANS_TEXT}

=== CRITIQUES ===
${critiques.map(c => JSON.stringify(c, null, 1)).join('\n\n')}

You are the final synthesizer. Produce the roadmap the project owner will implement.
Rules: every fatal flaw raised by a critic must be either fixed in your design or explicitly argued down with code evidence (open the files).
Take the best of both plans; do not just pick one. If the critics convinced you the feature should be smaller, or should not be built, say so in go_no_go and still write the roadmap for the version that IS worth building (which may be "optimise the interpreter first, compiler later").
Phases must be ordered so that each delivers something testable, the first phase must include the measurement that proves or disproves the benefit, and the estimates must be in days or weeks for one developer with an AI assistant.
The roadmap_markdown must be complete and self-contained; the owner will save it as specs/007-aot-compiler/roadmap.md without edits.`,
  {label: 'roadmap', phase: 'Roadmap', model: 'opus', effort: 'high', schema: ROADMAP_SCHEMA})

log(`Roadmap: ${roadmap ? roadmap.go_no_go : 'synthesizer failed'}`)
return {research: reports, bench, plans, critiques, roadmap}