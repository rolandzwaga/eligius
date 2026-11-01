import {TimelineAction} from '@action/timeline-action.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {addControllerToElement} from '@operation/add-controller-to-element.ts';
import {getGlobals} from '@operation/helper/globals.ts';
import type {TOperationData} from '@operation/types.ts';
import {
  asyncResolve,
  asyncUndefined,
  comparable,
  createAction,
  createEventbus,
  type IInterpreter,
  type IOperationSpec,
  type IRunResult,
  interpreters,
  record,
  returnUndefined,
  runAction,
  throwError,
  throwString,
} from '@test/differential/interpreters.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

/**
 * Quirks suite: one test per interpreter behaviour the Phase 1 dossier flagged
 * as easy to break (specs/007-aot-compiler/roadmap.md, section 8). Every case
 * runs twice (cold and warm) through the pinned reference interpreter and the
 * live one, asserts the pinned behaviour, and requires both interpreters to
 * agree on data, trace, error, globals and settling.
 */

type TSpecsFactory = (interpreter: IInterpreter) => IOperationSpec[];

interface IBothOptions {
  init?: () => TOperationData;
  globals?: () => Record<string, unknown>;
  eventbus?: (interpreter: IInterpreter) => IEventbus;
  runs?: number;
}

async function both(
  makeSpecs: TSpecsFactory,
  options: IBothOptions = {}
): Promise<IRunResult> {
  const runs = options.runs ?? 2;
  const results: Record<string, IRunResult[]> = {};
  for (const interpreter of interpreters) {
    const action = createAction(
      interpreter,
      makeSpecs(interpreter),
      options.eventbus?.(interpreter)
    );
    results[interpreter.name] = [];
    for (let run = 0; run < runs; run++) {
      results[interpreter.name].push(
        await runAction(action, options.init?.(), options.globals?.())
      );
    }
  }
  expect(results.live.map(comparable)).toEqual(
    results.reference.map(comparable)
  );
  return results.live[0];
}

const op = (
  systemName: string,
  operationData: TOperationData = {}
): IOperationSpec => ({systemName, operationData});
const shared = (
  systemName: string,
  instance: IOperationSpec['instance'],
  operationData: TOperationData = {}
): IOperationSpec => ({systemName, instance, operationData});
const rec = (): IOperationSpec => shared('record', record);

const recordsOf = (result: IRunResult, systemName = 'record') =>
  result.trace.filter(entry => entry.systemName === systemName);

describe('quirks: loops', () => {
  test('given a forEach over 3 items, when the body reads loopLength, then it is length - 1 on every iteration', async () => {
    const captureLength: IOperationSpec['instance'] = function (data) {
      data.lengths = [...(data.lengths ?? []), this.loopLength];
      return data;
    };
    const result = await both(() => [
      op('forEach', {collection: ['a', 'b', 'c']}),
      shared('captureLength', captureLength),
      op('endForEach'),
    ]);
    expect(result.data?.lengths).toEqual([2, 2, 2]);
  });

  test('given a body operation that deletes collection, when the next iteration starts, then the re-merge restores it', async () => {
    const deleteCollection: IOperationSpec['instance'] = data => {
      delete data.collection;
      return data;
    };
    const result = await both(() => [
      op('forEach', {collection: ['a', 'b']}),
      rec(),
      shared('deleteCollection', deleteCollection),
      op('endForEach'),
    ]);
    const records = recordsOf(result);
    expect(records).toHaveLength(2);
    for (const entry of records) {
      expect(entry.keys).toContain('collection');
    }
    expect(result.data).not.toHaveProperty('collection');
  });

  test('given an empty, a null and an unresolvable collection, when forEach runs, then the body is skipped and the loop ends cleanly', async () => {
    for (const collection of [[], null, '$operationdata.missing']) {
      const result = await both(() => [
        op('forEach', {collection}),
        rec(),
        op('endForEach'),
        shared('after', record),
      ]);
      expect(recordsOf(result)).toHaveLength(0);
      expect(recordsOf(result, 'after')).toHaveLength(1);
    }
  });

  test('given an async operation inside the loop body, when the loop runs, then every iteration completes in order', async () => {
    const result = await both(() => [
      op('forEach', {collection: ['a', 'b', 'c']}),
      shared('asyncResolve', asyncResolve),
      rec(),
      op('endForEach'),
    ]);
    expect(recordsOf(result).map(entry => entry.currentItem)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(result.settledAfterTicks).toBeGreaterThan(0);
  });

  test('given breakForEach inside a when inside the loop, when the condition matches, then the loop ends and later items are skipped', async () => {
    const result = await both(() => [
      op('forEach', {collection: [1, 2, 3, 4, 5]}),
      op('when', {expression: '$scope.currentItem==3'}),
      op('breakForEach'),
      op('endWhen'),
      rec(),
      op('endForEach'),
      shared('after', record),
    ]);
    expect(recordsOf(result).map(entry => entry.currentItem)).toEqual([1, 2]);
    expect(recordsOf(result, 'after')).toHaveLength(1);
  });

  test('given continueForEach inside nested whens, when the condition matches, then only that iteration is skipped', async () => {
    const result = await both(() => [
      op('forEach', {collection: [1, 2, 3, 4]}),
      op('when', {expression: 'true'}),
      op('when', {expression: '$scope.currentItem==2'}),
      op('continueForEach'),
      op('endWhen'),
      op('endWhen'),
      rec(),
      op('endForEach'),
    ]);
    expect(recordsOf(result).map(entry => entry.currentItem)).toEqual([
      1, 3, 4,
    ]);
  });

  test('given breakForEach outside any loop, when it runs, then it is a no-op', async () => {
    const result = await both(() => [op('breakForEach'), rec()]);
    expect(recordsOf(result)).toHaveLength(1);
  });
});

describe('quirks: expressions', () => {
  test("given the string operands 'false' and '0', when evaluated bare, then they are truthy", async () => {
    for (const expression of ["'false'", "'0'"]) {
      const result = await both(() => [
        op('when', {expression}),
        rec(),
        op('endWhen'),
      ]);
      expect(recordsOf(result)).toHaveLength(1);
    }
    const zero = await both(() => [
      op('when', {expression: '0'}),
      rec(),
      op('endWhen'),
    ]);
    expect(recordsOf(zero)).toHaveLength(0);
  });

  test('given == against null, when the chain resolves to undefined, then the comparison is strict and false', async () => {
    const result = await both(() => [
      op('when', {expression: '$operationdata.x==null'}),
      rec(),
      op('otherwise'),
      shared('else', record),
      op('endWhen'),
    ]);
    expect(recordsOf(result)).toHaveLength(0);
    expect(recordsOf(result, 'else')).toHaveLength(1);
  });

  test('given !a==b, when evaluated, then ! binds tighter than the comparison', async () => {
    // (!0)==false is false; !(0==false) would be true
    const result = await both(
      () => [
        op('when', {expression: '!$operationdata.a==$operationdata.b'}),
        rec(),
        op('endWhen'),
      ],
      {init: () => ({a: 0, b: false})}
    );
    expect(recordsOf(result)).toHaveLength(0);
  });

  test('given an invalid expression, when the action runs twice, then both runs fail with the same message and annotation', async () => {
    const result = await both(() => [
      rec(),
      op('when', {expression: '$operationdata.a == 1 == 2'}),
      op('endWhen'),
    ]);
    expect(result.error?.message).toMatch(/^when: unexpected '=='/);
    expect(result.error?.operationSystemName).toBe('when');
    expect(result.error?.operationIndex).toBe(1);
  });

  test('given an unknown operand, when evaluated, then the error names the operand and position', async () => {
    const result = await both(() => [
      op('when', {expression: 'foo==1'}),
      op('endWhen'),
    ]);
    expect(result.error?.message).toMatch(/^when: unknown operand 'foo'/);
  });
});

describe('quirks: property chains', () => {
  test('given +suffix chains, when resolved, then only the first suffix is appended and an empty suffix returns the raw value', async () => {
    const result = await both(
      () => [
        op('setOperationData', {
          properties: {
            px: '$operationdata.width+px',
            multi: '$operationdata.width+a+b',
            empty: '$operationdata.width+',
          },
        }),
      ],
      {init: () => ({width: 10})}
    );
    expect(result.data).toMatchObject({px: '10px', multi: '10a', empty: 10});
  });

  test('given the chain $operationdata. with nothing after the dot, when resolved, then it returns the bag itself', async () => {
    const result = await both(
      () => [op('setOperationData', {properties: {bag: '$operationdata.'}})],
      {init: () => ({a: 1})}
    );
    expect(result.data?.bag).toMatchObject({a: 1});
  });

  test('given bracket indices, when resolved, then they equal dotted indices', async () => {
    const result = await both(
      () => [
        op('setOperationData', {
          properties: {
            bracket: '$operationdata.items[1].name',
            dotted: '$operationdata.items.1.name',
          },
        }),
      ],
      {init: () => ({items: [{name: 'a'}, {name: 'b'}]})}
    );
    expect(result.data).toMatchObject({bracket: 'b', dotted: 'b'});
  });

  test('given a $globaldata read and an $operationdata read, when the results are mutated, then only the operation data source changes', async () => {
    let lastObj: {n: number} = {n: 0};
    const mutate: IOperationSpec['instance'] = data => {
      data.copy.n = 2;
      data.ref.n = 2;
      return data;
    };
    await both(
      () => [
        op('setOperationData', {
          properties: {copy: '$globaldata.g', ref: '$operationdata.obj'},
        }),
        shared('mutate', mutate),
      ],
      {
        init: () => {
          lastObj = {n: 1};
          return {obj: lastObj};
        },
        globals: () => ({g: {n: 1}}),
      }
    );
    expect(getGlobals().g.n).toBe(1);
    expect(lastObj.n).toBe(2);
  });

  test('given a forbidden segment, when resolved, then the chain is rejected with the configured chain in the message', async () => {
    const result = await both(() => [
      op('setOperationData', {properties: {x: '$operationdata.a.__proto__'}}),
    ]);
    expect(result.error?.message).toBe(
      "setOperationData: property chain '$operationdata.a.__proto__' contains forbidden segment '__proto__'. Property chains may not contain __proto__, prototype or constructor."
    );
  });

  test('given a chain through an undefined intermediate, when resolved, then the message names the resolved part', async () => {
    const result = await both(() => [
      op('setOperationData', {properties: {x: '$operationdata.a.b.c'}}),
    ]);
    expect(result.error?.message).toBe(
      "setOperationData: property chain 'a.b.c' cannot be resolved: 'a' is undefined."
    );
  });

  test('given setData targets, when written, then $operationdata, $scope.variables and $globaldata all receive the value', async () => {
    const result = await both(
      () => [
        op('setVariable', {name: 'v', value: 1}),
        op('setData', {
          properties: {
            '$operationdata.a': '$operationdata.b',
            '$scope.variables.v': 2,
            '$globaldata.g': '$operationdata.b',
          },
        }),
        op('setOperationData', {properties: {v: '$scope.variables.v'}}),
      ],
      {init: () => ({b: 'x'})}
    );
    expect(result.data).toMatchObject({a: 'x', v: 2});
    expect(getGlobals().g).toBe('x');
  });
});

describe('quirks: operation data flow', () => {
  test('given setOperationData with override, when properties swap two values, then the result has only the swapped values', async () => {
    const result = await both(
      () => [
        op('setOperationData', {
          override: true,
          properties: {a: '$operationdata.b', b: '$operationdata.a'},
        }),
      ],
      {init: () => ({a: 1, b: 2, c: 3})}
    );
    expect(result.data).toEqual({a: 2, b: 1});
  });

  test('given setOperationData without override, when properties swap two values, then the other keys stay', async () => {
    const result = await both(
      () => [
        op('setOperationData', {
          properties: {a: '$operationdata.b', b: '$operationdata.a'},
        }),
      ],
      {init: () => ({a: 1, b: 2, c: 3})}
    );
    expect(result.data).toEqual({a: 2, b: 1, c: 3});
  });

  test('given an operation that returns undefined, when the next runs, then it receives an empty bag', async () => {
    const result = await both(
      () => [shared('returnUndefined', returnUndefined), rec()],
      {init: () => ({a: 1})}
    );
    expect(recordsOf(result)[0].keys).toEqual([]);
    expect(result.data).toEqual({});
  });

  test('given a promise that resolves to undefined, when the next runs, then it receives an empty bag', async () => {
    const result = await both(
      () => [shared('asyncUndefined', asyncUndefined), rec()],
      {init: () => ({a: 1})}
    );
    expect(recordsOf(result)[0].keys).toEqual([]);
  });

  test('given a nested configured array mutated in a loop body, when the next iteration starts, then the cached loop copy is shared', async () => {
    const push: IOperationSpec['instance'] = data => {
      data.nested.push('x');
      data.seen = [...(data.seen ?? []), data.nested.length];
      return data;
    };
    const result = await both(() => [
      op('forEach', {collection: [1, 2, 3], nested: []}),
      shared('push', push),
      op('endForEach'),
    ]);
    // The loop copy is made once per loop, so the array grows across iterations.
    expect(result.data?.seen).toEqual([1, 2, 3]);
  });

  test('given a nested configured array mutated by setOperationData, when the action runs again, then each run sees fresh configured data', async () => {
    const push: IOperationSpec['instance'] = data => {
      data.list.push('x');
      return data;
    };
    const result = await both(() => [
      op('setOperationData', {properties: {list: ['seed']}}),
      shared('push', push),
    ]);
    expect(result.data?.list).toEqual(['seed', 'x']);
  });
});

describe('quirks: errors', () => {
  test('given a thrown string, when the action fails, then it is wrapped in an Error annotated with the operation', async () => {
    const result = await both(() => [
      rec(),
      shared('throwString', throwString),
    ]);
    expect(result.error).toEqual({
      message: 'chaos: thrown string',
      operationSystemName: 'throwString',
      operationIndex: 1,
      wrapped: true,
    });
  });

  test('given a nested action that fails, when the outer action rejects, then the innermost annotation wins', async () => {
    const result = await both(interpreter => {
      const inner = createAction(
        interpreter,
        [rec(), shared('throwError', throwError)],
        createEventbus(),
        false
      );
      return [rec(), shared('runNested', () => inner.start())];
    });
    expect(result.error).toEqual({
      message: 'chaos: thrown error',
      operationSystemName: 'throwError',
      operationIndex: 1,
      wrapped: false,
    });
  });
});

describe('quirks: controllers and timeline actions', () => {
  test('given addControllerToElement, when the controller keeps the bag, then it sees what later operations add', async () => {
    const controllers: Array<{data: TOperationData | undefined}> = [];
    const addKey: IOperationSpec['instance'] = data => {
      data.after = true;
      return data;
    };
    // A class instance: configured plain objects are deep-copied per run, so a
    // plain-object controller would receive init() on its copy.
    class FakeController {
      name = 'fake';
      data: TOperationData | undefined;
      init(data: TOperationData) {
        this.data = data;
      }
      attach() {}
      detach() {}
    }
    await both(() => {
      const controller = new FakeController();
      controllers.push(controller);
      return [
        shared('addControllerToElement', addControllerToElement, {
          selectedElement: $('<div/>'),
          controllerInstance: controller,
        }),
        shared('addKey', addKey),
      ];
    });
    for (const controller of controllers) {
      expect(controller.data?.after).toBe(true);
    }
  });

  test('given an active TimelineAction, when start is called again, then it resolves with an empty bag and end waits for the running start', async () => {
    const order: string[] = [];
    const slow: IOperationSpec['instance'] = data =>
      new Promise(resolve => {
        setTimeout(() => {
          order.push('start-done');
          resolve(data);
        }, 5);
      });
    const endOp: IOperationSpec['instance'] = data => {
      order.push('end-ran');
      return data;
    };
    const action = new TimelineAction(
      'ta',
      [{id: 's', systemName: 'slow', operationData: {}, instance: slow}],
      [{id: 'e', systemName: 'endOp', operationData: {}, instance: endOp}],
      {start: 0, end: 1},
      createEventbus()
    );
    const first = action.start({a: 1});
    const second = await action.start({a: 2});
    expect(second).toEqual({});
    const ended = action.end();
    await first;
    await ended;
    expect(order).toEqual(['start-done', 'end-ran']);
  });
});

describe('quirks: malformed and mutated operation lists', () => {
  test('given when / forEach / otherwise / endForEach / endWhen, when both branches are taken, then both interpreters agree', async () => {
    const outcomes: Record<string, unknown> = {};
    for (const expression of ['true', 'false']) {
      const result = await both(() => [
        op('when', {expression}),
        op('forEach', {collection: [1, 2]}),
        op('otherwise'),
        rec(),
        op('endForEach'),
        op('endWhen'),
        shared('after', record),
      ]);
      outcomes[expression] = {
        records: recordsOf(result).length,
        after: recordsOf(result, 'after').length,
        error: result.error?.message,
      };
    }
    // Pinned: with `false`, endForEach pops the when scope and endWhen pops
    // the root scope, so the next operation fails. A structural warning for
    // this shape is Phase 3 work; Phase 1 must not change it.
    expect(outcomes).toEqual({
      true: {records: 2, after: 1, error: undefined},
      false: {
        records: 1,
        after: 0,
        error: "Cannot read properties of undefined (reading 'newIndex')",
      },
    });
  });

  test('given a when without endWhen and an endForEach without forEach, when run, then both interpreters agree', async () => {
    const result = await both(() => [
      op('when', {expression: 'false'}),
      rec(),
      op('endForEach'),
      shared('after', record),
    ]);
    expect(result.error).toBeUndefined();
  });

  test('given an operations array mutated between runs, when the action runs again, then the new shape is executed', async () => {
    for (const interpreter of interpreters) {
      const action = createAction(interpreter, [
        op('when', {expression: 'true'}),
        rec(),
        op('endWhen'),
      ]);
      const before = await runAction(action);
      expect(recordsOf(before)).toHaveLength(1);

      action.startOperations.splice(2, 1); // drop endWhen
      action.startOperations.push(
        ...createAction(interpreter, [
          op('otherwise'),
          shared('else', record),
          op('endWhen'),
        ]).startOperations
      );
      const after = await runAction(action);
      expect(recordsOf(after)).toHaveLength(1);
      expect(recordsOf(after, 'else')).toHaveLength(0);

      action.startOperations[0] = {
        ...action.startOperations[0],
        operationData: {expression: 'false'},
      };
      const flipped = await runAction(action);
      expect(recordsOf(flipped)).toHaveLength(0);
      expect(recordsOf(flipped, 'else')).toHaveLength(1);
    }
  });
});
