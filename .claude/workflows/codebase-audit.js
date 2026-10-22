export const meta = {
  name: 'codebase-audit',
  description: 'Full-codebase audit: find bugs, improvements and optimisations, adversarially verify bugs with Opus, judge whether the engine needs expansion or only fixes',
  whenToUse: 'Periodic health check of the whole Eligius engine. Pass args {date}. Build the Markdown report afterwards from the run journal (build-report.js), because a report-writer agent proved unreliable.',
  phases: [
    {title: 'Audit', detail: '7 module auditors + 3 cross-cutting lenses read every source file', model: 'opus'},
    {title: 'Expand', detail: '3 independent proposers argue for (or against) expanding the framework', model: 'opus'},
    {title: 'Verify', detail: 'one Opus skeptic per reported bug tries to refute it', model: 'opus'},
    {title: 'Judge', detail: 'rank proposals against audit health; may conclude "mature, fixes only"', model: 'fable'}
  ],
}

const reportPath = (args && args.reportPath) || 'F:\\projects\\eligius\\eligius\\specs\\main\\codebase-audit-report.md'
const today = (args && args.date) || 'unknown date'

// ---------- Work-list -------------------------------------------------------

const AREAS = [
  {
    key: 'engine-core',
    files: 'src/eligius-engine.ts, src/eligius-flow-controller.ts, src/engine-factory.ts, src/types.ts, src/index.ts, src/metadata.ts, everything in src/action/',
    tests: 'src/test/unit/eligius-engine.spec.ts, src/test/unit/engine-factory.spec.ts, src/test/unit/action/, src/test/integration/',
    focus: 'play/pause/stop/seek/switchTimeline state machine, action scheduling at 0.1s precision, timelineComplete handling, destroy() completeness, promise ordering and error propagation out of actions',
  },
  {
    key: 'timeline-providers-adapters',
    files: 'everything in src/timelineproviders/ (position-sources, container-providers, playlist, types.ts) and src/adapters/',
    tests: 'src/test/unit/timelineproviders/, src/test/unit/adapters/',
    focus: 'position source lifecycle (init/activate/suspend/deactivate/destroy), synchronous state transitions, idempotent seek, RAF loop drift and cancellation, video.js and hotkeys-js resource release, scroll mapping edge cases, adapter double-wiring or dangling listeners',
  },
  {
    key: 'operations-a',
    files: 'src/operation/ files alphabetically from add-class.ts through get-text-content.ts (about 40 files), plus src/operation/types.ts and src/operation/index.ts',
    tests: 'matching specs in src/test/unit/operation/',
    focus: 'operation data flow (input/output typing matches runtime behaviour), @dependency/@required/@erased tags matching what the code actually reads and deletes, control-flow operations (when/otherwise/endWhen/forEach/break/continue) scope bookkeeping, async operations resolving in the right order',
  },
  {
    key: 'operations-b',
    files: 'src/operation/ files alphabetically from http-delete.ts through when.ts (about 40 files), plus everything in src/operation/helper/',
    tests: 'matching specs in src/test/unit/operation/ and src/test/unit/operation/helper/',
    focus: 'property-chain resolution (resolvePropertyChain, resolveExternalPropertyChain, internalResolve) correctness and prototype-pollution guards, globals store leaks, http operations error handling, storage operations, startAction/endAction/requestAction interplay with the engine, helper functions that silently swallow errors',
  },
  {
    key: 'controllers',
    files: 'everything in src/controllers/ except the generated metadata/ directory',
    tests: 'src/test/unit/controllers/',
    focus: 'BaseController attach/detach symmetry, listener and DOM reference release, LabelController and SubtitlesController locale updates, LottieController and lottie-web lifecycle, NavigationController/RoutingController history and hashchange handling, MutationObserverController disconnect, ProgressbarController update frequency',
  },
  {
    key: 'eventbus-locale-util',
    files: 'src/eventbus/ (eventbus.ts, listeners, interceptors, events/index.ts and a sample of event files, NOT the generated metadata/), src/locale/, src/importer/, src/util/ including util/guards/',
    tests: 'src/test/unit/eventbus/, src/test/unit/locale/, src/test/unit/importer/, src/test/unit/util/',
    focus: 'once() and off() correctness under re-entrant broadcasts, request/response timeouts or hangs, interceptor ordering, clear() leaving stale state, LocaleLoader async failures, rosetta fallback behaviour, TypedEventEmitter listener removal, animationInterval cancellation, guards accepting wrong types',
  },
  {
    key: 'configuration-tools',
    files: 'src/configuration/ (types.ts, configuration-resolver.ts, api/*), src/tools/ (code-generator, schema-tools, doc-tools)',
    tests: 'src/test/unit/configuration/, src/test/unit/tools/ if present',
    focus: 'ConfigurationResolver error messages naming the JSON path, immutability after resolution, fluent API editors producing configs that the resolver accepts, unknown operation/controller names failing fast, generators producing metadata that diverges from the doc tags, schema generation gaps',
  },
]

const LENSES = [
  {
    key: 'lens-lifecycle-memory',
    focus: 'Memory and lifecycle across the WHOLE codebase. Trace every place that registers a listener, timer, RAF, observer, jQuery handler, hotkeys binding, video.js player or lottie animation and confirm there is a matching release on detach/destroy/deactivate. Trace EngineFactory.createEngine -> destroy() end to end. Report every unmatched acquisition as a bug with the exact acquisition and the missing release site.',
    files: 'start from src/engine-factory.ts, src/eligius-engine.ts, src/controllers/base-controller.ts, src/timelineproviders/position-sources/base-position-source.ts, src/util/typed-event-emitter.ts, then follow every reference',
  },
  {
    key: 'lens-security-robustness',
    focus: 'Security and robustness across the WHOLE codebase. Configuration is untrusted JSON. Check: prototype pollution via property chains (__proto__, constructor, prototype keys) in src/operation/helper/, src/operation/set-*.ts and get-*.ts; HTML injection via set-element-content, create-element, replace-text, format-text, LabelController, SubtitlesController; custom-function and invoke-object-method executing arbitrary code paths; get-import; http-* operations; URL handling in RoutingController; storage operations. Also check error handling: operations that throw without naming the operation, errors that leave the engine in a corrupt state.',
    files: 'src/operation/, src/operation/helper/, src/controllers/, src/configuration/configuration-resolver.ts',
  },
  {
    key: 'lens-performance',
    focus: 'Performance of the hot path across the WHOLE codebase. Follow one tick: position source emits -> engine receives -> actions are looked up and started/ended -> operations run -> DOM is touched. Find allocations, O(n) scans or Map rebuilds per tick, redundant jQuery lookups, unbatched DOM writes causing reflow, float rounding bugs in the 0.1s key computation, unnecessary promise chains in synchronous paths, and any work done in the RAF callback that could be done once. Quantify with concrete reasoning (per-tick cost for a timeline with N actions).',
    files: 'src/eligius-engine.ts, src/eligius-flow-controller.ts, src/action/, src/timelineproviders/position-sources/raf-position-source.ts, src/util/animation-interval.ts, src/operation/helper/, src/operation/select-element.ts, src/operation/animate*.ts',
  },
]

const PROPOSERS = [
  {
    key: 'author-first',
    stance: 'You represent people who AUTHOR Eligius configurations (JSON or via the Eligian DSL at https://github.com/rolandzwaga/eligian). What is painful or impossible to express today? Which gaps force them to drop to custom-function? Only propose things that remove a real, recurring pain.',
  },
  {
    key: 'integrator-first',
    stance: 'You represent engineers EMBEDDING the engine in a product (React/Vue/plain apps, bundlers, SSR, testing). What makes integration brittle: peer deps, globals, jQuery coupling, missing hooks, lack of observability or debugging aids, bundle size, tree-shaking, TypeScript ergonomics? Only propose things that materially change integration cost.',
  },
  {
    key: 'maturity-skeptic',
    stance: 'You are the SKEPTIC. Your default position is that the engine is feature-complete and should only receive fixes, tests and small tweaks. Argue that position with evidence from the code, CHANGELOG and specs. You may still list up to 3 expansions, but ONLY if you cannot honestly argue them away; for each, say what evidence would change your mind.',
  },
]

// ---------- Schemas ---------------------------------------------------------

const FINDINGS = {
  type: 'object',
  properties: {
    health: {type: 'string', description: 'Two or three sentences: overall state of this area, biggest risk, test coverage impression'},
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: {type: 'string', enum: ['bug', 'improvement', 'optimisation']},
          title: {type: 'string', maxLength: 90},
          file: {type: 'string', description: 'repo-relative path with forward slashes'},
          line: {type: 'integer'},
          severity: {type: 'string', enum: ['critical', 'high', 'medium', 'low']},
          summary: {type: 'string'},
          evidence: {type: 'string', description: 'the exact code you read that proves it, quoted'},
          failure_scenario: {type: 'string', description: 'bugs only: concrete input/state -> wrong behaviour'},
          suggested_fix: {type: 'string'},
        },
        required: ['kind', 'title', 'file', 'line', 'severity', 'summary', 'evidence', 'suggested_fix'],
      },
    },
    test_gaps: {type: 'array', items: {type: 'string'}, description: 'behaviours you confirmed are untested, as "file: behaviour"'},
  },
  required: ['health', 'findings', 'test_gaps'],
}

const VERDICT = {
  type: 'object',
  properties: {
    verdict: {type: 'string', enum: ['confirmed', 'refuted', 'uncertain']},
    reasoning: {type: 'string'},
    corrected_severity: {type: 'string', enum: ['critical', 'high', 'medium', 'low']},
    corrected_fix: {type: 'string', description: 'better fix than proposed, or empty string'},
    repro_test: {type: 'string', description: 'confirmed only: a Vitest test name in Given-When-Then form that would fail today'},
  },
  required: ['verdict', 'reasoning', 'corrected_severity', 'corrected_fix'],
}

const PROPOSALS = {
  type: 'object',
  properties: {
    maturity_assessment: {type: 'string', description: 'Your honest view: is the engine mature? What is the evidence?'},
    proposals: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          title: {type: 'string', maxLength: 80},
          problem_it_solves: {type: 'string', description: 'the concrete pain today, with a reference to code or docs that shows it'},
          who_benefits: {type: 'string'},
          design_sketch: {type: 'string', description: 'how it fits the existing architecture: which modules, new operations/events/controllers, public API impact'},
          effort: {type: 'string', enum: ['small', 'medium', 'large']},
          risk: {type: 'string'},
          breaking: {type: 'boolean'},
        },
        required: ['title', 'problem_it_solves', 'who_benefits', 'design_sketch', 'effort', 'risk', 'breaking'],
      },
    },
  },
  required: ['maturity_assessment', 'proposals'],
}

const JUDGEMENT = {
  type: 'object',
  properties: {
    verdict: {type: 'string', enum: ['mature-fixes-only', 'mature-plus-targeted-expansion', 'needs-expansion']},
    rationale: {type: 'string'},
    recommended: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {type: 'string'},
          why: {type: 'string'},
          effort: {type: 'string', enum: ['small', 'medium', 'large']},
          source: {type: 'string'},
          prerequisites: {type: 'string', description: 'which confirmed bugs or improvements must land first'},
        },
        required: ['title', 'why', 'effort', 'source', 'prerequisites'],
      },
    },
    rejected: {
      type: 'array',
      items: {
        type: 'object',
        properties: {title: {type: 'string'}, why: {type: 'string'}},
        required: ['title', 'why'],
      },
    },
  },
  required: ['verdict', 'rationale', 'recommended', 'rejected'],
}

const REPORT = {
  type: 'object',
  properties: {
    reportPath: {type: 'string'},
    headline: {type: 'string', description: 'one sentence verdict'},
    counts: {
      type: 'object',
      properties: {
        confirmed_bugs: {type: 'integer'},
        uncertain_bugs: {type: 'integer'},
        refuted_bugs: {type: 'integer'},
        improvements: {type: 'integer'},
        optimisations: {type: 'integer'},
        expansions_recommended: {type: 'integer'},
      },
      required: ['confirmed_bugs', 'uncertain_bugs', 'refuted_bugs', 'improvements', 'optimisations', 'expansions_recommended'],
    },
    top_actions: {type: 'array', maxItems: 5, items: {type: 'string'}},
  },
  required: ['reportPath', 'headline', 'counts', 'top_actions'],
}

// ---------- Prompts ---------------------------------------------------------

const COMMON_RULES = `
Working directory: F:\\projects\\eligius\\eligius (Windows; use backslash paths with Read/Grep/Glob).
Read the files FULLY with Read; do not skim or sample. Use Grep to follow references across modules and the ts_* typegraph MCP tools (via ToolSearch) when you need definitions or references.
Also read the matching tests so you know what is already covered and what the intended behaviour is.
Rules for findings:
- A "bug" is a defect you can describe as concrete input/state -> wrong output/behaviour, backed by quoted code. If you cannot write the failure_scenario, it is not a bug; file it as an improvement or drop it.
- An "improvement" changes API, design, typing, error messages, testability or maintainability in a way a maintainer would act on. No style nits; Biome handles those.
- An "optimisation" must name the hot path it affects and why it matters at runtime (per tick, per action, per seek). No micro-optimisations without a hot path.
- Do NOT propose new features here. That is a separate stage.
- Do NOT report generated files (src/**/metadata/*, jsonschema/, docs/).
- Quote the exact code in "evidence". Use repo-relative forward-slash paths and the real line number.
- Be exhaustive within your scope, then stop. Ten solid findings beat thirty speculative ones.
- The codebase may have just been through a fix round. Read the "Unreleased" section of CHANGELOG.md first. Do not re-report behaviour it says was fixed unless the current code shows the fix is wrong or incomplete; new code from that round deserves the same scrutiny as old code.
`

const auditPrompt = a => `You are auditing one slice of the Eligius timeline engine (TypeScript, browser, jQuery peer dep).

SCOPE: ${a.files}
${a.tests ? `TESTS FOR THIS SCOPE: ${a.tests}` : ''}
FOCUS: ${a.focus}
${COMMON_RULES}
Return findings for THIS scope only. In "health", say plainly whether this slice looks mature.`

const proposePrompt = p => `You are evaluating whether the Eligius timeline engine should be EXPANDED, and if so how.

STANCE: ${p.stance}

Ground yourself first. Read: README.md, CHANGELOG.md, specs/position-source-ideas.md, the spec.md in each specs/00*-* directory, src/index.ts (public API), src/types.ts, src/configuration/types.ts, src/operation/index.ts (the operation catalogue), src/controllers/index.ts, src/eventbus/events/index.ts. Skim src/eligius-engine.ts and src/engine-factory.ts. The "Unreleased" section of CHANGELOG.md lists what was just added; do not re-propose it. Working directory F:\\projects\\eligius\\eligius (Windows paths).

Rules:
- Expansion must be MEANINGFUL: it removes a real pain or unlocks a real class of use that is impossible or awkward today. "Nice to have" and "other frameworks have it" are not reasons.
- For every proposal, point at the code or doc that proves the pain exists today.
- Prefer proposals that compose with the existing architecture (operations, controllers, events, position sources, adapters) over new subsystems.
- Say if a proposal is breaking.
- Concluding "the engine is mature, do not expand" is a fully acceptable answer. Say so in maturity_assessment and return few or zero proposals.`

const refutePrompt = b => `A code auditor reported this bug in the Eligius engine (working directory F:\\projects\\eligius\\eligius, Windows paths). Your job is to REFUTE it.

Title: ${b.title}
File: ${b.file} line ${b.line}
Severity claimed: ${b.severity}
Summary: ${b.summary}
Evidence quoted: ${b.evidence}
Failure scenario: ${b.failure_scenario || '(none given)'}
Suggested fix: ${b.suggested_fix}

Read the file and every caller/callee needed to settle it. Check the tests in src/test/ for this behaviour. Try hard to find the reason it is NOT a bug: a guard elsewhere, an invariant that makes the state unreachable, a misread of the code, behaviour that is documented and intended, or a test that already covers it.
- "confirmed" only if you independently traced the failure scenario through the real code and it holds. Then write repro_test.
- "refuted" if you found the guard/invariant/misread; explain exactly where.
- "uncertain" if it depends on runtime conditions you cannot settle from the code (say which).
Default to refuted when the evidence is thin. Correct the severity honestly: a bug nobody can trigger from a valid configuration is low.`

const judgePrompt = (proposals, healthSummary, confirmedBugs) => `You are the final judge on whether the Eligius timeline engine should be expanded or is mature and only needs fixes.

AUDIT HEALTH BY AREA (from ten independent auditors):
${healthSummary}

CONFIRMED BUGS (${confirmedBugs.length}):
${confirmedBugs.map(b => `- [${b.verdict.corrected_severity}] ${b.title} (${b.file}:${b.line})`).join('\n') || '- none'}

PROPOSALS FROM THREE PROPOSERS (author-first, integrator-first, maturity-skeptic):
${JSON.stringify(proposals, null, 2)}

Decide:
1. verdict: mature-fixes-only / mature-plus-targeted-expansion / needs-expansion. A codebase with real bugs and thin tests should fix first; say so.
2. recommended: at most 5 expansions, ranked, each with prerequisites (which bugs or improvements should land first). Merge duplicate proposals from different proposers. Reject anything whose "problem_it_solves" is not backed by evidence.
3. rejected: every other proposal with one honest sentence why.
You may verify any claim by reading the code at F:\\projects\\eligius\\eligius (Windows paths). Be decisive.`

const synthPrompt = (data) => `Write the final Eligius codebase audit report as Markdown to exactly this path using the Write tool: ${data.reportPath}
Date: ${data.date}. Audience: the maintainer of Eligius, who knows the code well. No preamble, no praise padding.

Structure (use these headers):
# Eligius codebase audit (${data.date})
## Verdict
One paragraph: the judge's verdict and rationale. Then a small table of counts.
## Confirmed bugs
Sorted by corrected severity. For each: title, file:line as a markdown link like [file.ts:42](src/file.ts#L42), failure scenario, fix (prefer corrected_fix if non-empty), repro test name.
## Uncertain (needs a human look)
Same shape, with the verifier's reasoning.
## Improvements
Grouped by area. One line each: file:line link, title, why.
## Optimisations
One line each with the hot path affected.
## Test gaps
Deduplicated list grouped by area.
## Expansion
The judge's recommended list (title, why, effort, prerequisites) then the rejected list with reasons. If the verdict is mature-fixes-only, say so in one line and keep the rejected list.
## Refuted reports
Collapsed <details> block listing refuted bugs with the one-line reason, so the maintainer knows what was checked.
## Suggested order of work
Numbered list of at most 8 steps: fix critical/high bugs first, then improvements that unblock expansions, then expansions.

Keep every line attributable to a file. Do not invent findings; use only the data below.

DATA:
${JSON.stringify(data, null, 2)}

After writing the file, return the structured summary.`

// ---------- Run -------------------------------------------------------------

phase('Audit')
log(`Auditing ${AREAS.length} module slices + ${LENSES.length} cross-cutting lenses; 3 expansion proposers run alongside`)

const auditsP = parallel([...AREAS, ...LENSES].map(a => () =>
  agent(auditPrompt(a), {label: `audit:${a.key}`, phase: 'Audit', schema: FINDINGS, model: 'opus'})
    .then(r => r && ({...r, area: a.key}))))

const proposalsP = parallel(PROPOSERS.map(p => () =>
  agent(proposePrompt(p), {label: `propose:${p.key}`, phase: 'Expand', schema: PROPOSALS, model: 'opus'})
    .then(r => r && ({...r, proposer: p.key}))))

const audits = (await auditsP).filter(Boolean)
log(`Audit done: ${audits.length}/${AREAS.length + LENSES.length} auditors returned`)

const norm = s => String(s || '').replace(/\\/g, '/').replace(/^.*?eligius\/eligius\//i, '').toLowerCase()
// Exact file and line: bucketing nearby lines merged distinct bugs (the 2026-10-21 rerun lost one).
// A duplicate reported by two auditors at the same line is still merged.
const keyOf = f => `${norm(f.file)}:${f.line || 0}:${f.kind}`

const seen = new Set()
const all = []
for (const a of audits) {
  for (const f of a.findings || []) {
    const k = keyOf(f)
    if (seen.has(k)) continue
    seen.add(k)
    all.push({...f, file: norm(f.file), area: a.area})
  }
}
const bugs = all.filter(f => f.kind === 'bug')
const improvements = all.filter(f => f.kind === 'improvement')
const optimisations = all.filter(f => f.kind === 'optimisation')
const testGaps = audits.map(a => ({area: a.area, gaps: a.test_gaps || []}))
const healthSummary = audits.map(a => `- ${a.area}: ${a.health}`).join('\n')

log(`Deduplicated: ${bugs.length} bugs, ${improvements.length} improvements, ${optimisations.length} optimisations`)

const VERIFY_CAP = 120
const sevRank = {critical: 0, high: 1, medium: 2, low: 3}
bugs.sort((x, y) => (sevRank[x.severity] ?? 9) - (sevRank[y.severity] ?? 9))
const toVerify = bugs.slice(0, VERIFY_CAP)
const unverified = bugs.slice(VERIFY_CAP)
if (unverified.length) log(`Cap: ${unverified.length} low-ranked bug reports will be listed as unverified`)

phase('Verify')
const verified = (await pipeline(
  toVerify,
  b => agent(refutePrompt(b), {label: `verify:${b.file.split('/').pop()}:${b.line}`, phase: 'Verify', schema: VERDICT, model: 'opus'}),
  (v, b) => ({...b, verdict: v || {verdict: 'uncertain', reasoning: 'verifier did not return', corrected_severity: b.severity, corrected_fix: ''}}),
)).filter(Boolean)

const confirmed = verified.filter(b => b.verdict.verdict === 'confirmed')
const uncertain = verified.filter(b => b.verdict.verdict === 'uncertain')
  .concat(unverified.map(b => ({...b, verdict: {verdict: 'uncertain', reasoning: 'not verified (cap)', corrected_severity: b.severity, corrected_fix: ''}})))
const refuted = verified.filter(b => b.verdict.verdict === 'refuted')
log(`Verify done: ${confirmed.length} confirmed, ${uncertain.length} uncertain, ${refuted.length} refuted`)

const proposals = (await proposalsP).filter(Boolean)

phase('Judge')
const judgement = await agent(judgePrompt(proposals, healthSummary, confirmed), {label: 'judge', phase: 'Judge', schema: JUDGEMENT, model: 'fable'})
log(`Judge verdict: ${judgement ? judgement.verdict : 'no verdict'}`)

return {judgementVerdict: judgement && judgement.verdict, confirmedCount: confirmed.length, uncertainCount: uncertain.length, refutedCount: refuted.length, unverifiedCount: unverified.length, improvements: improvements.length, optimisations: optimisations.length}
