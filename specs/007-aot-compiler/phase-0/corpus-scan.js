// Scans configuration-like sources for the Phase 0 corpus questions.
const fs = require('fs');
const path = require('path');
const roots = process.argv.slice(2);
const files = [];
const walk = d => {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p);
    } else if (/\.(ts|json|md|eligian|js)$/.test(e.name)) files.push(p);
  }
};
for (const r of roots) {
  if (fs.statSync(r).isDirectory()) walk(r);
  else files.push(r);
}
const count = (s, re) => (s.match(re) || []).length;
const rows = [];
const totals = {
  files: 0,
  when: 0,
  endWhen: 0,
  forEach: 0,
  endForEach: 0,
  newIndex: 0,
  customFunction: 0,
  customOps: 0,
  startAction: 0,
  literalLoops: [],
};
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const r = {
    file: path.relative(process.cwd(), f),
    when:
      count(s, /['"]when['"]|systemName:\s*whenSystemName|\bwhen\s*\(/g) -
      count(s, /\bwhen\s*\(this|when\.call|\bwhen\(\{/g),
    endWhen: count(s, /['"]endWhen['"]|endWhenSystemName/g),
    forEach: count(s, /['"]forEach['"]|forEachSystemName\b(?!.*endForEach)/g),
    endForEach: count(s, /['"]endForEach['"]|endForEachSystemName/g),
    newIndex: count(s, /\$scope\.newIndex/g),
    customFunction: count(s, /['"]customFunction['"]|\bcustomFunction\b/g),
    startAction: count(s, /['"]startAction['"]|['"]requestAction['"]/g),
  };
  // literal collections: collection: [ ... ] -> count items
  const loops = [];
  for (const m of s.matchAll(/collection:\s*(\[[^\]]*\])/g)) {
    try {
      loops.push(eval(m[1]).length);
    } catch {
      loops.push(-1);
    }
  }
  for (const m of s.matchAll(/Array\.from\(\{length:\s*(\d+)\}/g))
    loops.push(Number(m[1]));
  r.loops = loops;
  if (
    r.when ||
    r.endWhen ||
    r.forEach ||
    r.endForEach ||
    r.newIndex ||
    r.customFunction ||
    r.startAction ||
    loops.length
  ) {
    rows.push(r);
    totals.files++;
    for (const k of [
      'when',
      'endWhen',
      'forEach',
      'endForEach',
      'newIndex',
      'customFunction',
      'startAction',
    ])
      totals[k] += r[k];
    totals.literalLoops.push(...loops);
  }
}
const unbalanced = rows.filter(
  r => r.when !== r.endWhen || r.forEach !== r.endForEach
);
console.log(
  JSON.stringify(
    {
      scanned: files.length,
      totals,
      unbalancedFiles: unbalanced.map(
        r =>
          `${r.file} when=${r.when}/${r.endWhen} forEach=${r.forEach}/${r.endForEach}`
      ),
      newIndexFiles: rows.filter(r => r.newIndex).map(r => r.file),
      customFunctionFiles: rows
        .filter(r => r.customFunction)
        .map(r => `${r.file} (${r.customFunction})`),
      loopSizes: totals.literalLoops.sort((a, b) => a - b),
    },
    null,
    1
  )
);
