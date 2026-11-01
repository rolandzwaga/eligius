// Instruments Action._runOperations (every start and end of every action goes
// through it) and records wall time per run. Boundaries are clusters of runs
// that start within 40 ms of each other.
//
// Gate G1 (amended criterion a): the time is split between the operations'
// own work (`opMs`, the time inside the operation functions, including the
// jQuery calls they make) and the interpreter (`interpMs`, the time inside
// `Action.executeOperation` that is NOT inside an operation function: scope
// handling, configured-data copies, dispatch). A nested action started by
// `startAction` runs inside that operation's time, so its interpreter time is
// counted on its own record only.
import {Action} from 'eligius';

export const runs = [];
const wrapped = new WeakSet();
let activeRecord = null;

function wrapOperations(operations) {
  for (const operation of operations) {
    if (wrapped.has(operation)) continue;
    wrapped.add(operation);
    const instance = operation.instance;
    operation.instance = function profiledOperation(data) {
      const record = activeRecord;
      const t0 = performance.now();
      try {
        return instance.call(this, data);
      } finally {
        if (record) record.opMs += performance.now() - t0;
      }
    };
  }
}

const originalRun = Action.prototype._runOperations;
Action.prototype._runOperations = function (
  operations,
  initOperationData,
  onSettled
) {
  wrapOperations(operations);
  const phase = operations === this.startOperations ? 'start' : 'end';
  const t0 = performance.now();
  const record = {
    action: this.name,
    phase,
    ops: operations.length,
    t0,
    sync: 0,
    total: 0,
    opMs: 0,
    interpMs: 0,
  };
  runs.push(record);
  recordsByOperations.set(operations, record);
  const result = originalRun.call(this, operations, initOperationData, () => {
    record.total = performance.now() - t0;
    if (onSettled) onSettled();
  });
  record.sync = performance.now() - t0;
  return result;
};

// A run's operations array identifies its record while its segments execute
// (one segment per synchronous stretch of executeOperation).
const recordsByOperations = new WeakMap();
const originalExecute = Action.prototype.executeOperation;
Action.prototype.executeOperation = function (operations, ...rest) {
  const record = recordsByOperations.get(operations) ?? activeRecord;
  const outer = activeRecord;
  activeRecord = record;
  const opsBefore = record ? record.opMs : 0;
  const t0 = performance.now();
  try {
    return originalExecute.call(this, operations, ...rest);
  } finally {
    const elapsed = performance.now() - t0;
    if (record) record.interpMs += elapsed - (record.opMs - opsBefore);
    activeRecord = outer;
  }
};

export function summarize(label) {
  const sorted = [...runs].sort((a, b) => a.t0 - b.t0);
  const clusters = [];
  for (const r of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && r.t0 - last.end <= 40) {
      last.runs.push(r);
      last.end = Math.max(last.end, r.t0 + r.sync);
    } else {
      clusters.push({start: r.t0, end: r.t0 + r.sync, runs: [r]});
    }
  }
  const sum = (list, key) => +list.reduce((s, r) => s + r[key], 0).toFixed(3);
  const boundaries = clusters.map(c => ({
    runs: c.runs.length,
    ops: c.runs.reduce((s, r) => s + r.ops, 0),
    syncMs: sum(c.runs, 'sync'),
    totalMs: sum(c.runs, 'total'),
    opMs: sum(c.runs, 'opMs'),
    interpMs: sum(c.runs, 'interpMs'),
    actions: c.runs.map(r => `${r.action}.${r.phase}`),
  }));
  const by = k => boundaries.map(b => b[k]);
  const median = list =>
    [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
  const summary = {
    label,
    userAgent: navigator.userAgent,
    runs: runs.length,
    boundaries: boundaries.length,
    worstSyncMs: Math.max(...by('syncMs')),
    worstTotalMs: Math.max(...by('totalMs')),
    medianSyncMs: median(by('syncMs')),
    // Interpreter time only (amended G1 criterion a)
    worstInterpMs: Math.max(...by('interpMs')),
    medianInterpMs: median(by('interpMs')),
    totalInterpMs: +by('interpMs')
      .reduce((s, v) => s + v, 0)
      .toFixed(3),
    totalOpMs: +by('opMs')
      .reduce((s, v) => s + v, 0)
      .toFixed(3),
    maxRunsPerBoundary: Math.max(...by('runs')),
    maxOpsPerBoundary: Math.max(...by('ops')),
    slowestBoundaries: [...boundaries]
      .sort((a, b) => b.syncMs - a.syncMs)
      .slice(0, 5),
    slowestBoundariesByInterp: [...boundaries]
      .sort((a, b) => b.interpMs - a.interpMs)
      .slice(0, 5),
    slowestRuns: [...runs]
      .sort((a, b) => b.sync - a.sync)
      .slice(0, 5)
      .map(r => ({
        action: r.action,
        phase: r.phase,
        ops: r.ops,
        syncMs: +r.sync.toFixed(3),
        totalMs: +r.total.toFixed(3),
        opMs: +r.opMs.toFixed(3),
        interpMs: +r.interpMs.toFixed(3),
      })),
  };
  window.__profile = summary;
  console.log('PROFILE ' + JSON.stringify(summary));
  return summary;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
