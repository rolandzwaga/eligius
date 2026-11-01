import {Action as LiveAction} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {breakForEach as liveBreakForEach} from '@operation/break-for-each.ts';
import {continueForEach as liveContinueForEach} from '@operation/continue-for-each.ts';
import {endForEach as liveEndForEach} from '@operation/end-for-each.ts';
import {endWhen as liveEndWhen} from '@operation/end-when.ts';
import {forEach as liveForEach} from '@operation/for-each.ts';
import {
  clearGlobals,
  getGlobals,
  setGlobals,
} from '@operation/helper/globals.ts';
import {otherwise as liveOtherwise} from '@operation/otherwise.ts';
import {selectElement as liveSelectElement} from '@operation/select-element.ts';
import {setData as liveSetData} from '@operation/set-data.ts';
import {setOperationData as liveSetOperationData} from '@operation/set-operation-data.ts';
import {setVariable as liveSetVariable} from '@operation/set-variable.ts';
import type {
  IOperationScope,
  TOperation,
  TOperationData,
} from '@operation/types.ts';
import {when as liveWhen} from '@operation/when.ts';
import {Action as ReferenceAction} from '@test/differential/reference-interpreter/action.ts';
import {breakForEach as referenceBreakForEach} from '@test/differential/reference-interpreter/break-for-each.ts';
import {continueForEach as referenceContinueForEach} from '@test/differential/reference-interpreter/continue-for-each.ts';
import {endForEach as referenceEndForEach} from '@test/differential/reference-interpreter/end-for-each.ts';
import {endWhen as referenceEndWhen} from '@test/differential/reference-interpreter/end-when.ts';
import {forEach as referenceForEach} from '@test/differential/reference-interpreter/for-each.ts';
import {otherwise as referenceOtherwise} from '@test/differential/reference-interpreter/otherwise.ts';
import {selectElement as referenceSelectElement} from '@test/differential/reference-interpreter/select-element.ts';
import {setData as referenceSetData} from '@test/differential/reference-interpreter/set-data.ts';
import {setOperationData as referenceSetOperationData} from '@test/differential/reference-interpreter/set-operation-data.ts';
import {setVariable as referenceSetVariable} from '@test/differential/reference-interpreter/set-variable.ts';
import {when as referenceWhen} from '@test/differential/reference-interpreter/when.ts';

/**
 * The two interpreters the differential harness compares: the live code under
 * `src/` and the pinned copy under `reference-interpreter/`.
 *
 * Operations that Phase 1 does not touch (recording, chaos, DOM operations
 * other than selectElement) are shared; the control-flow and data operations
 * come from the interpreter under test.
 */
export type TAnyOperation = TOperation<any, any>;

export interface IInterpreter {
  name: 'live' | 'reference';
  Action: typeof LiveAction;
  operations: Record<string, TAnyOperation>;
}

export const liveInterpreter: IInterpreter = {
  name: 'live',
  Action: LiveAction,
  operations: {
    when: liveWhen,
    otherwise: liveOtherwise,
    endWhen: liveEndWhen,
    forEach: liveForEach,
    endForEach: liveEndForEach,
    breakForEach: liveBreakForEach,
    continueForEach: liveContinueForEach,
    setData: liveSetData,
    setOperationData: liveSetOperationData,
    setVariable: liveSetVariable,
    selectElement: liveSelectElement,
  },
};

export const referenceInterpreter: IInterpreter = {
  name: 'reference',
  Action: ReferenceAction as unknown as typeof LiveAction,
  operations: {
    when: referenceWhen,
    otherwise: referenceOtherwise,
    endWhen: referenceEndWhen,
    forEach: referenceForEach,
    endForEach: referenceEndForEach,
    breakForEach: referenceBreakForEach,
    continueForEach: referenceContinueForEach,
    setData: referenceSetData,
    setOperationData: referenceSetOperationData,
    setVariable: referenceSetVariable,
    selectElement: referenceSelectElement,
  },
};

export const interpreters: IInterpreter[] = [
  referenceInterpreter,
  liveInterpreter,
];

/**
 * One operation of a differential case. `instance` names an operation of the
 * interpreter under test, or is a shared function.
 */
export interface IOperationSpec {
  systemName: string;
  operationData?: TOperationData;
  instance?: TAnyOperation;
}

export interface ITraceEntry {
  index: number;
  systemName: string;
  loopIndex: number | undefined;
  currentItem: unknown;
  whenEvaluation: boolean | undefined;
  keys: string[];
}

export interface IRunResult {
  data: TOperationData | undefined;
  /** JSON of the final data, keys in insertion order, functions and jQuery objects described */
  dataJson: string | undefined;
  error:
    | {
        message: string;
        operationSystemName: string | undefined;
        operationIndex: number | undefined;
        wrapped: boolean;
      }
    | undefined;
  trace: ITraceEntry[];
  globals: string;
  /** Microtask ticks until the returned promise settled (0 = synchronously resolved promise) */
  settledAfterTicks: number;
}

/**
 * State the chaos operations consult, reset by {@link runOperations} before
 * every run so that both interpreters see identical chaos.
 */
export const runState = {
  jumpsFired: 0,
  trace: [] as ITraceEntry[],
};

export function describeValue(
  value: unknown,
  path: Set<object> = new Set()
): unknown {
  if (typeof value === 'function') {
    return '[function]';
  }
  if (value !== null && typeof value === 'object') {
    if (typeof (value as {jquery?: unknown}).jquery === 'string') {
      return `[jquery:${(value as JQuery).length}]`;
    }
    if (typeof Node !== 'undefined' && value instanceof Node) {
      return `[node:${(value as Node).nodeName}]`;
    }
    if (path.has(value)) {
      return '[cycle]';
    }
    path.add(value);
    try {
      if (Array.isArray(value)) {
        return value.map(item => describeValue(item, path));
      }
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        out[key] = describeValue((value as Record<string, unknown>)[key], path);
      }
      return out;
    } finally {
      path.delete(value);
    }
  }
  if (value === undefined) {
    return '[undefined]';
  }
  return value;
}

export function createEventbus(root?: JQuery): IEventbus {
  const eventbus = new Eventbus();
  if (root) {
    eventbus.onRequest('request-engine-root', () => root);
  }
  return eventbus;
}

export function resolveSpecs(
  interpreter: IInterpreter,
  specs: IOperationSpec[],
  trace = true
): IResolvedOperation[] {
  return specs.map((spec, index) => {
    const instance = spec.instance ?? interpreter.operations[spec.systemName];
    if (!instance) {
      throw new Error(
        `differential: no operation '${spec.systemName}' for interpreter ${interpreter.name}`
      );
    }
    const traced: TAnyOperation = trace
      ? function (this: IOperationScope, operationData: TOperationData) {
          runState.trace.push({
            index: this.currentIndex,
            systemName: spec.systemName,
            loopIndex: this.loopIndex,
            currentItem: describeValue(this.currentItem),
            whenEvaluation: this.whenEvaluation,
            keys: Object.keys(operationData ?? {}),
          });
          return instance.call(this, operationData);
        }
      : instance;
    return {
      id: `op-${index}`,
      systemName: spec.systemName,
      operationData: spec.operationData ?? {},
      instance: traced,
    };
  });
}

export function createAction(
  interpreter: IInterpreter,
  specs: IOperationSpec[],
  eventbus: IEventbus = createEventbus(),
  trace = true
) {
  return new interpreter.Action(
    'differential',
    resolveSpecs(interpreter, specs, trace),
    eventbus
  );
}

/**
 * Runs the action's start operations and summarises everything the
 * differential harness compares.
 */
export async function runAction(
  action: LiveAction,
  initOperationData?: TOperationData,
  globals: Record<string, unknown> = {}
): Promise<IRunResult> {
  clearGlobals();
  setGlobals(globals);
  runState.jumpsFired = 0;
  runState.trace = [];

  let settledAfterTicks = -1;
  let data: TOperationData | undefined;
  let error: IRunResult['error'];
  const promise = action.start(initOperationData).then(
    value => {
      data = value;
    },
    (reason: unknown) => {
      const annotated = reason as Error & {
        operationSystemName?: string;
        operationIndex?: number;
        cause?: unknown;
      };
      error = {
        message:
          annotated instanceof Error ? annotated.message : String(reason),
        operationSystemName: annotated?.operationSystemName,
        operationIndex: annotated?.operationIndex,
        wrapped: annotated instanceof Error && annotated.cause !== undefined,
      };
    }
  );
  for (let tick = 0; tick < 1000; tick++) {
    await Promise.resolve();
    if (data !== undefined || error !== undefined) {
      settledAfterTicks = tick;
      break;
    }
  }
  if (settledAfterTicks === -1) {
    await promise;
    settledAfterTicks = 1000;
  }

  return {
    data,
    dataJson:
      data === undefined ? undefined : JSON.stringify(describeValue(data)),
    error,
    trace: runState.trace,
    globals: JSON.stringify(describeValue(getGlobals())),
    settledAfterTicks,
  };
}

/** Runs the same specs through one interpreter. */
export async function runWith(
  interpreter: IInterpreter,
  specs: IOperationSpec[],
  initOperationData?: TOperationData,
  options: {globals?: Record<string, unknown>; eventbus?: IEventbus} = {}
): Promise<IRunResult> {
  const action = createAction(interpreter, specs, options.eventbus);
  return runAction(action, initOperationData, options.globals);
}

/**
 * The part of a run result that must be identical between interpreters.
 */
export function comparable(result: IRunResult) {
  return {
    dataJson: result.dataJson,
    error: result.error,
    trace: result.trace,
    globals: result.globals,
    settledAfterTicks: result.settledAfterTicks,
  };
}

// ---------------------------------------------------------------- shared ops

/** Records its scope and returns the data unchanged. */
export const record: TAnyOperation = operationData => operationData;

/** Returns undefined: the interpreter must continue with `{}`. */
export const returnUndefined: TAnyOperation = () => undefined;

/** Returns a new object: later operations must see the new identity. */
export const returnNew: TAnyOperation = operationData => ({
  ...operationData,
  fresh: true,
});

/** Resolves asynchronously with the same data. */
export const asyncResolve: TAnyOperation = operationData =>
  Promise.resolve(operationData);

/** Resolves asynchronously with undefined. */
export const asyncUndefined: TAnyOperation = () =>
  Promise.resolve(undefined as unknown as TOperationData);

/** Rejects with an Error. */
export const reject: TAnyOperation = () =>
  Promise.reject(new Error('chaos: rejected'));

/** Throws a non-Error value. */
export const throwString: TAnyOperation = () => {
  throw 'chaos: thrown string';
};

/** Throws an Error synchronously. */
export const throwError: TAnyOperation = () => {
  throw new Error('chaos: thrown error');
};

/** Pushes into a nested configured array, if the data has one. */
export const mutateNested: TAnyOperation = operationData => {
  if (Array.isArray(operationData.nested)) {
    operationData.nested.push('mutated');
  }
  return operationData;
};

/**
 * Sets `newIndex` to the configured target the first time it runs in a run,
 * so a backward jump can never loop forever.
 */
export const jumpOnce: TAnyOperation = function (operationData) {
  if (runState.jumpsFired === 0) {
    runState.jumpsFired++;
    this.newIndex = operationData.target;
  }
  return operationData;
};

/** Writes the configured globals through the shared store. */
export const setGlobal: TAnyOperation = operationData => {
  setGlobals(operationData.values ?? {});
  return operationData;
};

export const sharedOperations: Record<string, TAnyOperation> = {
  record,
  returnUndefined,
  returnNew,
  asyncResolve,
  asyncUndefined,
  reject,
  throwString,
  throwError,
  mutateNested,
  jumpOnce,
  setGlobal,
};
