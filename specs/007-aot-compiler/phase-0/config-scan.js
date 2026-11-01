// JSON-aware scan of an Eligius configuration for the Phase 0 corpus questions.
const fs = require('fs');
const c = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const allActions = [];
for (const t of c.timelines || [])
  for (const a of t.timelineActions || [])
    allActions.push({kind: 'timeline', timeline: t.uri, ...a});
for (const a of c.initActions || []) allActions.push({kind: 'init', ...a});
for (const a of c.actions || []) allActions.push({kind: 'action', ...a});
for (const a of c.eventActions || []) allActions.push({kind: 'event', ...a});
const chainRe = /\$(operationdata|globaldata|scope)\.[^\s"']+/g;
const asyncOps = new Set([
  'animate',
  'wait',
  'loadJson',
  'httpGet',
  'httpPost',
  'httpPut',
  'httpDelete',
  'requestAction',
  'startAction',
  'endAction',
  'customFunction',
  'addControllerToElement',
  'animateWithClass',
  'getImport',
]);
const summary = {
  actions: allActions.length,
  byKind: {},
  phases: [],
  unbalanced: [],
  loops: [],
  newIndexWrites: 0,
  customFunction: 0,
  chains: {operationdata: 0, globaldata: 0, scope: 0},
  opsPerPhase: [],
  composition: {requestAction: 0, startAction: 0, endAction: 0},
  asyncOpsPerPhase: [],
};
for (const a of allActions) {
  summary.byKind[a.kind] = (summary.byKind[a.kind] || 0) + 1;
  for (const phase of ['startOperations', 'endOperations']) {
    const list = a[phase] || [];
    if (!list.length) continue;
    const names = list.map(o => o.systemName);
    const n = s => names.filter(x => x === s).length;
    summary.opsPerPhase.push(list.length);
    summary.asyncOpsPerPhase.push(names.filter(x => asyncOps.has(x)).length);
    if (n('when') !== n('endWhen') || n('forEach') !== n('endForEach'))
      summary.unbalanced.push(
        `${a.name}.${phase} when=${n('when')}/${n('endWhen')} forEach=${n('forEach')}/${n('endForEach')}`
      );
    summary.composition.requestAction += n('requestAction');
    summary.composition.startAction += n('startAction');
    summary.composition.endAction += n('endAction');
    for (const o of list) {
      const text = JSON.stringify(o.operationData || {});
      if (o.systemName === 'forEach') {
        const col = o.operationData?.collection;
        summary.loops.push({
          action: a.name,
          collection: Array.isArray(col)
            ? `literal[${col.length}]`
            : String(col),
        });
      }
      if (text.includes('$scope.newIndex')) summary.newIndexWrites++;
      if (o.systemName === 'customFunction') summary.customFunction++;
      for (const m of text.matchAll(chainRe)) summary.chains[m[1]]++;
    }
  }
}
const sorted = [...summary.opsPerPhase].sort((a, b) => a - b);
summary.opsPerPhaseStats = {
  phases: sorted.length,
  min: sorted[0],
  median: sorted[Math.floor(sorted.length / 2)],
  p90: sorted[Math.floor(sorted.length * 0.9)],
  max: sorted[sorted.length - 1],
  total: sorted.reduce((s, x) => s + x, 0),
};
delete summary.opsPerPhase;
summary.asyncOpsPerPhaseMax = Math.max(...summary.asyncOpsPerPhase);
delete summary.asyncOpsPerPhase;
// Fan-out: a timeline action's startAction/requestAction calls run other actions; estimate ops executed per timeline action start, one level deep.
const byName = new Map(allActions.map(a => [a.name, a]));
const expanded = [];
for (const a of allActions.filter(a => a.kind === 'timeline')) {
  let total = 0;
  const visit = (act, depth) => {
    for (const o of act.startOperations || []) {
      total++;
      if (
        (o.systemName === 'startAction' || o.systemName === 'requestAction') &&
        depth < 5
      ) {
        const target = byName.get(o.operationData?.actionName);
        if (target && o.systemName === 'startAction') visit(target, depth + 1);
      }
    }
  };
  visit(a, 0);
  expanded.push({
    action: a.name,
    timeline: a.timeline,
    start: a.duration?.start,
    opsIncludingCalledActions: total,
  });
}
expanded.sort(
  (x, y) => y.opsIncludingCalledActions - x.opsIncludingCalledActions
);
summary.heaviestTimelineActions = expanded.slice(0, 5);
// boundaries: group timeline actions by (timeline, start position)
const boundaries = new Map();
for (const e of expanded) {
  const k = `${e.timeline}@${e.start}`;
  boundaries.set(k, (boundaries.get(k) || 0) + 1);
}
summary.actionsPerBoundary = {
  boundaries: boundaries.size,
  max: Math.max(...boundaries.values()),
  atPositionZero: [...boundaries.entries()]
    .filter(([k]) => k.endsWith('@0'))
    .map(([k, v]) => `${k}: ${v}`),
};
console.log(JSON.stringify(summary, null, 1));
