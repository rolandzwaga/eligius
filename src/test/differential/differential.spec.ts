import type {TOperationData} from '@operation/types.ts';
import {
  comparable,
  createAction,
  type IInterpreter,
  type IOperationSpec,
  type IRunResult,
  interpreters,
  runAction,
  sharedOperations,
} from '@test/differential/interpreters.ts';
import fc from 'fast-check';
import {describe, expect, test} from 'vitest';

/**
 * Differential fuzzing: generated operation lists run through the pinned
 * reference interpreter and the live one, three times each (cold, warm, and
 * after the operations array was mutated), and every comparable part of the
 * result must be identical.
 *
 * `DIFFERENTIAL_RUNS` sets the number of cases per seed (default 150).
 * `DIFFERENTIAL_SEED` pins the rotating seed; a failure report prints the
 * seed and path to reproduce.
 */

const NUM_RUNS = Number(process.env.DIFFERENTIAL_RUNS) || 500;
const FIXED_SEED = 20261101;
const ROTATING_SEED =
  Number(process.env.DIFFERENTIAL_SEED) || Math.floor(Math.random() * 1e9);

// ---------------------------------------------------------------- arbitraries

const literal = fc.oneof(
  fc.integer({min: -3, max: 3}),
  fc.constantFrom('x', 'y', '', '0', 'false'),
  fc.boolean(),
  fc.constant(null)
);

const chain = fc.constantFrom(
  '$operationdata.a',
  '$operationdata.b',
  '$operationdata.c',
  '$operationdata.items',
  '$operationdata.items[0]',
  '$operationdata.items.1',
  '$operationdata.obj.n',
  '$operationdata.a+px',
  '$operationdata.',
  '$scope.currentItem',
  '$scope.loopIndex',
  '$scope.variables.v',
  '$globaldata.g',
  '$globaldata.obj.n',
  '$operationdata.missing.deeper',
  '$operationdata.a.__proto__'
);

const operand = fc.oneof(
  {arbitrary: chain, weight: 3},
  {
    arbitrary: fc.constantFrom(
      '1',
      '0',
      "'x'",
      "'false'",
      'true',
      'false',
      'null'
    ),
    weight: 2,
  }
);

const comparison = fc.constantFrom('==', '!=', '>', '<', '>=', '<=');

const {expression} = fc.letrec(tie => ({
  expression: fc.oneof(
    {depthSize: 'small', depthIdentifier: 'expr'},
    tie('atom'),
    tie('compare'),
    tie('not'),
    tie('binary'),
    tie('paren')
  ),
  atom: operand,
  compare: fc
    .tuple(operand, comparison, operand)
    .map(([left, operator, right]) => `${left}${operator}${right}`),
  not: tie('expression').map(inner => `!${inner}`),
  binary: fc
    .tuple(tie('expression'), fc.constantFrom('&&', '||'), tie('expression'))
    .map(([left, operator, right]) => `${left} ${operator} ${right}`),
  paren: tie('expression').map(inner => `(${inner})`),
}));

const anyExpression = fc.oneof(
  {arbitrary: expression as fc.Arbitrary<string>, weight: 9},
  {arbitrary: fc.constantFrom('', '1==', 'a b', '1 & 1', '(1'), weight: 1}
);

const spec = (
  systemName: string,
  operationData: TOperationData = {}
): IOperationSpec => ({systemName, operationData});

const sharedSpec = (
  systemName: string,
  operationData: TOperationData = {}
): IOperationSpec => ({
  systemName,
  operationData,
  instance: sharedOperations[systemName],
});

const value = fc.oneof({arbitrary: literal, weight: 2}, chain);

const setDataSpec = fc
  .tuple(
    fc.constantFrom(
      '$operationdata.a',
      '$operationdata.b',
      '$operationdata.obj.n',
      '$scope.variables.v',
      '$globaldata.g',
      '$operationdata.missing.x'
    ),
    value
  )
  .map(([target, v]) => spec('setData', {properties: {[target]: v}}));

const setOperationDataSpec = fc
  .record({
    override: fc.boolean(),
    keys: fc.uniqueArray(fc.constantFrom('a', 'b', 'w', 'obj'), {
      minLength: 1,
      maxLength: 2,
    }),
    values: fc.array(fc.oneof(value, fc.record({n: value})), {
      minLength: 2,
      maxLength: 2,
    }),
  })
  .map(({override, keys, values}) => {
    const properties: TOperationData = {};
    keys.forEach((key, index) => {
      properties[key] = values[index];
    });
    return spec(
      'setOperationData',
      override ? {override, properties} : {properties}
    );
  });

const setVariableSpec = fc
  .tuple(fc.constantFrom('v', 'w'), literal)
  .map(([name, v]) => spec('setVariable', {name, value: v}));

const setGlobalSpec = literal.map(g =>
  sharedSpec('setGlobal', {values: {g, obj: {n: g}}})
);

const chaosSpec = fc.oneof(
  fc
    .constantFrom(
      'returnUndefined',
      'returnNew',
      'asyncResolve',
      'asyncUndefined',
      'reject',
      'throwString',
      'throwError'
    )
    .map(name => sharedSpec(name)),
  fc.constant(sharedSpec('mutateNested', {nested: ['seed']})),
  fc.integer({min: 0, max: 14}).map(target => sharedSpec('jumpOnce', {target}))
);

const simple = fc.oneof(
  {arbitrary: fc.constant(sharedSpec('record')), weight: 4},
  {arbitrary: setDataSpec, weight: 3},
  {arbitrary: setOperationDataSpec, weight: 3},
  {arbitrary: setVariableSpec, weight: 1},
  {arbitrary: setGlobalSpec, weight: 1},
  {arbitrary: chaosSpec, weight: 2}
);

const collection = fc.constantFrom<unknown>(
  '$operationdata.items',
  [1, 2, 3],
  ['a'],
  [],
  '$operationdata.missing',
  null,
  '$scope.variables.v'
);

const {items} = fc.letrec<{
  items: IOperationSpec[];
  item: IOperationSpec[];
  whenBlock: IOperationSpec[];
  loopBlock: IOperationSpec[];
}>(tie => ({
  items: fc
    .array(tie('item'), {maxLength: 4})
    .map(blocks => (blocks as IOperationSpec[][]).flat()),
  item: fc.oneof(
    {depthSize: 'small', depthIdentifier: 'block'},
    {arbitrary: simple.map(s => [s]), weight: 3},
    tie('whenBlock'),
    tie('loopBlock')
  ),
  whenBlock: fc
    .record({
      expression: anyExpression,
      then: tie('items'),
      otherwise: fc.option(tie('items'), {nil: undefined}),
    })
    .map(({expression: e, then, otherwise}) => [
      spec('when', {expression: e}),
      ...(then as IOperationSpec[]),
      ...(otherwise
        ? [spec('otherwise'), ...(otherwise as IOperationSpec[])]
        : []),
      spec('endWhen'),
    ]),
  loopBlock: fc
    .record({
      collection,
      body: tie('items'),
      jump: fc.option(
        fc.record({
          kind: fc.constantFrom('breakForEach', 'continueForEach'),
          guard: fc.option(anyExpression, {nil: undefined}),
        }),
        {nil: undefined}
      ),
    })
    .map(({collection: c, body, jump}) => [
      spec('forEach', {collection: c, nested: ['seed']}),
      ...(body as IOperationSpec[]),
      ...(jump
        ? jump.guard !== undefined
          ? [
              spec('when', {expression: jump.guard}),
              spec(jump.kind),
              spec('endWhen'),
            ]
          : [spec(jump.kind)]
        : []),
      spec('endForEach'),
    ]),
}));

const CONTROL_FLOW = new Set([
  'when',
  'otherwise',
  'endWhen',
  'forEach',
  'endForEach',
  'breakForEach',
  'continueForEach',
]);

/** About one case in ten is made malformed by dropping or swapping an operation. */
const malformation = fc.option(
  fc.record({
    kind: fc.constantFrom('drop', 'swap'),
    at: fc.nat(),
  }),
  {nil: undefined, freq: 10}
);

function malform(
  specs: IOperationSpec[],
  change: {kind: string; at: number} | undefined
): IOperationSpec[] {
  if (!change || specs.length < 2) {
    return specs;
  }
  const flow = specs
    .map((s, index) => (CONTROL_FLOW.has(s.systemName) ? index : -1))
    .filter(index => index >= 0);
  if (!flow.length) {
    return specs;
  }
  const index = flow[change.at % flow.length];
  const copy = specs.slice();
  if (change.kind === 'drop') {
    copy.splice(index, 1);
  } else {
    const other = (index + 1) % copy.length;
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

const differentialCase = fc
  .tuple(items, malformation)
  .map(([specs, change]) => malform(specs as IOperationSpec[], change));

// ---------------------------------------------------------------- property

function freshInit(): TOperationData {
  return {a: 1, b: 'x', c: false, items: [1, 2, 3], obj: {n: 1}};
}

function freshGlobals(): Record<string, unknown> {
  return {g: 'G', obj: {n: 0}};
}

function cloneSpecs(specs: IOperationSpec[]): IOperationSpec[] {
  return specs.map(s => ({
    ...s,
    operationData: structuredClone(s.operationData ?? {}),
  }));
}

async function runThreeTimes(
  interpreter: IInterpreter,
  specs: IOperationSpec[]
): Promise<ReturnType<typeof comparable>[]> {
  const action = createAction(interpreter, cloneSpecs(specs));
  const results: IRunResult[] = [];
  results.push(await runAction(action, freshInit(), freshGlobals()));
  results.push(await runAction(action, freshInit(), freshGlobals()));
  // Mutate the installed operations array: append a recording op and drop
  // the first control-flow op, if any.
  action.startOperations.push(
    ...createAction(interpreter, [sharedSpec('record')]).startOperations
  );
  const flowIndex = action.startOperations.findIndex(o =>
    CONTROL_FLOW.has(o.systemName)
  );
  if (flowIndex >= 0) {
    action.startOperations.splice(flowIndex, 1);
  }
  results.push(await runAction(action, freshInit(), freshGlobals()));
  return results.map(comparable);
}

async function agree(specs: IOperationSpec[]): Promise<void> {
  const reference = await runThreeTimes(interpreters[0], specs);
  const live = await runThreeTimes(interpreters[1], specs);
  expect(live).toEqual(reference);
}

describe('differential: live interpreter vs pinned reference', () => {
  test(`given ${NUM_RUNS} generated operation lists (fixed seed), when both interpreters run them, then every result is identical`, {
    timeout: 120_000,
  }, async () => {
    await fc.assert(fc.asyncProperty(differentialCase, agree), {
      seed: FIXED_SEED,
      numRuns: NUM_RUNS,
    });
  });

  test(`given ${NUM_RUNS} generated operation lists (rotating seed), when both interpreters run them, then every result is identical`, {
    timeout: 120_000,
  }, async () => {
    console.log(`differential rotating seed: ${ROTATING_SEED}`);
    await fc.assert(fc.asyncProperty(differentialCase, agree), {
      seed: ROTATING_SEED,
      numRuns: NUM_RUNS,
    });
  });
});
