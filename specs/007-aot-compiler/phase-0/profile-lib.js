// Instruments Action._runOperations (every start and end of every action goes
// through it) and records wall time per run. Boundaries are clusters of runs
// that start within 40 ms of each other.
import {Action} from 'eligius';

export const runs = [];
const original = Action.prototype._runOperations;
Action.prototype._runOperations = function (
  operations,
  initOperationData,
  onSettled
) {
  const phase = operations === this.startOperations ? 'start' : 'end';
  const t0 = performance.now();
  const record = {
    action: this.name,
    phase,
    ops: operations.length,
    t0,
    sync: 0,
    total: 0,
  };
  runs.push(record);
  const result = original.call(this, operations, initOperationData, () => {
    record.total = performance.now() - t0;
    if (onSettled) onSettled();
  });
  record.sync = performance.now() - t0;
  return result;
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
  const boundaries = clusters.map(c => ({
    runs: c.runs.length,
    ops: c.runs.reduce((s, r) => s + r.ops, 0),
    syncMs: +c.runs.reduce((s, r) => s + r.sync, 0).toFixed(3),
    totalMs: +c.runs.reduce((s, r) => s + r.total, 0).toFixed(3),
    actions: c.runs.map(r => `${r.action}.${r.phase}`),
  }));
  const by = k => boundaries.map(b => b[k]);
  const summary = {
    label,
    userAgent: navigator.userAgent,
    runs: runs.length,
    boundaries: boundaries.length,
    worstSyncMs: Math.max(...by('syncMs')),
    worstTotalMs: Math.max(...by('totalMs')),
    medianSyncMs: by('syncMs').sort((a, b) => a - b)[
      Math.floor(boundaries.length / 2)
    ],
    maxRunsPerBoundary: Math.max(...by('runs')),
    maxOpsPerBoundary: Math.max(...by('ops')),
    slowestBoundaries: [...boundaries]
      .sort((a, b) => b.syncMs - a.syncMs)
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
      })),
  };
  window.__profile = summary;
  console.log('PROFILE ' + JSON.stringify(summary));
  return summary;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
