export const meta = {
  name: 'verify-bugs',
  description: 'Adversarially verify a list of reported bugs: one Opus skeptic per report tries to refute it, flags duplicates of already-confirmed bugs',
  whenToUse: 'After codebase-audit, for the reports left unverified. args: {unverified: [...bug reports], confirmed: [{title,file,line}]}',
  phases: [{title: 'Verify', detail: 'one Opus skeptic per reported bug', model: 'opus'}],
}

// args: {file: absolute path to JSON {unverified: [...], confirmed: [...]}, labels: ['basename:line', ...]}
// Bugs are read by each skeptic from the file by index; the payload is too large to pass inline.
const file = args && args.file
const labels = (args && args.labels) || []
const bugs = labels.map((label, index) => ({label, index}))

const VERDICT = {
  type: 'object',
  properties: {
    verdict: {type: 'string', enum: ['confirmed', 'refuted', 'uncertain', 'duplicate']},
    reasoning: {type: 'string'},
    corrected_severity: {type: 'string', enum: ['critical', 'high', 'medium', 'low']},
    corrected_fix: {type: 'string', description: 'better fix than proposed, or empty string'},
    repro_test: {type: 'string', description: 'confirmed only: a Vitest test name in Given-When-Then form that would fail today'},
    duplicate_of: {type: 'string', description: 'duplicate only: the title of the confirmed bug it duplicates'},
  },
  required: ['verdict', 'reasoning', 'corrected_severity', 'corrected_fix'],
}

const refutePrompt = b => `A code auditor reported a bug in the Eligius engine (working directory F:\\projects\\eligius\\eligius, Windows paths). Your job is to REFUTE it.

First, Read the JSON file ${file}. Your bug report is the element at index ${b.index} (zero-based) of its "unverified" array (label ${b.label}). The "confirmed" array in the same file lists bugs already confirmed; use it for the duplicate check below.

Then read the source file named in the report and every caller/callee needed to settle it. Check the tests in src/test/ for this behaviour. Try hard to find the reason it is NOT a bug: a guard elsewhere, an invariant that makes the state unreachable, a misread of the code, behaviour that is documented and intended, or a test that already proves the opposite.

Verdicts:
- "confirmed" only if you independently traced the failure scenario through the real code and it holds from a VALID configuration or a documented public API call. Then write repro_test.
- "refuted" if you found the guard/invariant/misread; name the exact file and line.
- "uncertain" if it depends on runtime conditions you cannot settle from the code (say which).
- "duplicate" if this is the SAME root cause as one of the already-confirmed bugs in the JSON file (set duplicate_of to its title). A different symptom of the same defect is a duplicate; a different defect in the same file is not.

Default to refuted when the evidence is thin. Correct the severity honestly: a bug nobody can trigger from a valid configuration is low; a bug that silently breaks a documented feature on every page is high or critical.`

phase('Verify')
log(`Verifying ${bugs.length} bug reports with Opus skeptics`)

const verified = (await pipeline(
  bugs,
  b => agent(refutePrompt(b), {label: `verify:${b.label}`, phase: 'Verify', schema: VERDICT, model: 'opus'}),
  (v, b) => ({...b, verdict: v || {verdict: 'uncertain', reasoning: 'verifier did not return', corrected_severity: 'low', corrected_fix: ''}}),
)).filter(Boolean)

const tally = verified.reduce((m, b) => ((m[b.verdict.verdict] = (m[b.verdict.verdict] || 0) + 1), m), {})
log(`Verify done: ${JSON.stringify(tally)}`)

return {tally, verified}
