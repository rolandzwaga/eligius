import {Action, EndableAction} from '@action/index.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/index.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {forEach} from '@operation/for-each.ts';
import type {IOperationScope} from '@operation/types.ts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type TestContext,
  test,
  vi,
} from 'vitest';

type ActionContext = {
  action: Action;
} & TestContext;
function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<ActionContext>('Action', () => {
  beforeEach<ActionContext>(context => {
    vi.useFakeTimers();
    withContext(context);

    const startOperations: any[] = [];
    const eventBus = new Eventbus();
    context.action = new Action('test', startOperations, eventBus);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  test<ActionContext>('Should create succesfully', context => {
    // given
    const {action} = context;
    //test

    // expect
    expect(action.startOperations.length).toBe(0);
    expect(action.name).toBe('test');
  });
  test<ActionContext>('should execute simple operations in sequence', async context => {
    // given
    const {action} = context;
    const opData1 = {value1: 'op1'};
    const op1: IResolvedOperation = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: opData1,
      instance: (op: any) => {
        op.result = [op.value1];
        return op;
      },
    };
    const opData2 = {value2: 'op2'};
    const op2: IResolvedOperation = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: opData2,
      instance: (op: any) => {
        op.result.push(op.value2);
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    const operationData = await action.start();

    // expect
    expect(operationData.result[0]).toBe('op1');
    expect(operationData.result[1]).toBe('op2');
  });
  test<ActionContext>('should execute async operations in sequence', async context => {
    // given
    const {action} = context;
    const opData1 = {value1: 'op1'};
    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: opData1,
      instance: (op: any) => {
        op.result = [op.value1];
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 500);
        });
      },
    };
    const opData2 = {value2: 'op2'};
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: opData2,
      instance: (op: any) => {
        op.result.push(op.value2);
        return new Promise(resolve => setTimeout(() => resolve(op), 200));
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    const resultPromise = action.start();
    await vi.runAllTimersAsync();
    const operationData = await resultPromise;

    expect(operationData.result[0]).toBe('op1');
    expect(operationData.result[1]).toBe('op2');
  });
  test<ActionContext>('should execute async and simple operations mixed in sequence', async context => {
    // given
    const {action} = context;
    const opData1 = {value1: 'op1'};
    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: opData1,
      instance: (op: any) => {
        op.result = [op.value1];
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 500);
        });
      },
    };
    const opData2 = {value2: 'op2'};
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: opData2,
      instance: (op: any) => {
        op.result.push(op.value2);
        return op;
      },
    };
    const opData3 = {value3: 'op3'};
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
      operationData: opData3,
      instance: (op: any) => {
        op.result.push(op.value3);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 200);
        });
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);

    // test
    const resultPromise = action.start();
    await vi.runAllTimersAsync();
    const operationData = await resultPromise;

    expect(operationData.result[0]).toBe('op1');
    expect(operationData.result[1]).toBe('op2');
    expect(operationData.result[2]).toBe('op3');
  });
  test<ActionContext>('should attach a context to the operation', async context => {
    const {action} = context;
    const opData = {value: 'op'};
    const op = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: opData,
      instance: function (op: any) {
        op.result = [];
        op.result.push(this);
        return op;
      },
    };
    action.startOperations.push(op);

    // test
    const operationData = await action.start();
    // expect
    expect(operationData.result[0]).not.toBeUndefined();
  });
  test<ActionContext>('should add current operation index number to the context given to the operation', async context => {
    const {action} = context;
    const opData1 = {value1: 'op1'};
    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: opData1,
      instance: function (this: IOperationScope, op: any) {
        op.result = [];
        op.result.push(this.currentIndex);
        return op;
      },
    };
    const opData2 = {value2: 'op2'};
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: opData2,
      instance: function (this: IOperationScope, op: any) {
        op.result.push(this.currentIndex);
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    const operationData = await action.start();
    expect(operationData.result[0]).toBe(0);
    expect(operationData.result[1]).toBe(1);
  });

  test<ActionContext>('given an Action with forEach over 20000 items and one sync inner op, when start is called, then it resolves and the inner op ran 20000 times', async context => {
    // given
    const {action} = context;
    // The collection is resolved by reference from the operation data.
    const items = Array.from({length: 20000}, (_, i) => i);
    const inner = vi.fn((data: any) => data);
    action.startOperations.push(
      {
        id: 'loop',
        systemName: 'forEach',
        operationData: {collection: '$operationData.items'},
        instance: forEach as any,
      },
      {id: 'inner', systemName: 'inner', operationData: {}, instance: inner},
      {
        id: 'end-loop',
        systemName: 'endForEach',
        operationData: {},
        instance: endForEach as any,
      }
    );

    // test
    await action.start({items});

    // expect
    expect(inner).toHaveBeenCalledTimes(20000);
  });

  test<ActionContext>('given operations that mutate and erase their data inside a forEach, when the action is started several times, then the configured operation data is unchanged and every execution sees fresh data', async context => {
    // given
    const {action} = context;
    const items = [
      {id: 1, tags: ['a']},
      {id: 2, tags: ['b']},
      {id: 3, tags: ['c']},
    ];
    const seenItems: string[] = [];
    const seenNestedLengths: number[] = [];
    const seenClassNames: string[] = [];

    action.startOperations.push(
      {
        id: 'prepare',
        systemName: 'prepare',
        operationData: {className: 'active', erased: 'gone'},
        instance: (data: any) => {
          seenClassNames.push(data.className);
          data.className = `${data.className}-changed`;
          delete data.erased;
          return data;
        },
      },
      {
        id: 'loop',
        systemName: 'forEach',
        operationData: {collection: items},
        instance: forEach as any,
      },
      {
        id: 'body',
        systemName: 'body',
        operationData: {options: {nested: [1, 2]}, label: 'body'},
        instance: function (this: IOperationScope, data: any) {
          const item = this.currentItem as {id: number; tags: string[]};
          seenItems.push(JSON.stringify(item));
          seenNestedLengths.push(data.options.nested.length);
          // Mutate everything the operation can reach.
          item.tags.push('mutated');
          item.id = -1;
          data.collection.push({id: 99, tags: []});
          data.options.nested.push(3);
          data.label = 'changed';
          delete data.options;
          return data;
        },
      },
      {
        id: 'end-loop',
        systemName: 'endForEach',
        operationData: {},
        instance: endForEach as any,
      }
    );
    const snapshots = action.startOperations.map(operation =>
      structuredClone(operation.operationData)
    );

    // test
    for (let run = 0; run < 3; run++) {
      await action.start();
    }

    // expect
    expect(
      action.startOperations.map(operation => operation.operationData)
    ).toEqual(snapshots);
    const expectedItems = [
      '{"id":1,"tags":["a"]}',
      '{"id":2,"tags":["b"]}',
      '{"id":3,"tags":["c"]}',
    ];
    expect(seenItems).toEqual([
      ...expectedItems,
      ...expectedItems,
      ...expectedItems,
    ]);
    expect(seenNestedLengths).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2]);
    expect(seenClassNames).toEqual(['active', 'active', 'active']);
  });

  test<ActionContext>('given a sync operation that throws, when start is called, then the returned promise rejects with that error', async context => {
    // given
    const {action} = context;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    action.startOperations.push({
      id: 'boom',
      systemName: 'boom',
      operationData: {},
      instance: () => {
        throw new Error('boom');
      },
    });

    // test & expect
    await expect(action.start()).rejects.toThrow('boom');
  });

  test<ActionContext>('given a failing start operation, when start is called, then the action rejects without logging to the console itself', async context => {
    // given
    const {action} = context;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    action.startOperations.push({
      id: 'boom',
      systemName: 'boom',
      operationData: {},
      instance: () => {
        throw new Error('boom');
      },
    });

    // test
    await expect(action.start()).rejects.toThrow('boom');

    // expect
    expect(consoleError).not.toHaveBeenCalled();
  });

  test<ActionContext>('given a start chain awaiting a promise inside a forEach, when end() runs before that promise resolves, then the start chain keeps its own loop scope', async () => {
    // given
    const recorded: unknown[] = [];
    const endOperationsSeen: unknown[] = [];
    const action = new EndableAction(
      'concurrent',
      [
        {
          id: 'loop',
          systemName: 'forEach',
          operationData: {collection: [1, 2, 3]},
          instance: forEach as any,
        },
        {
          id: 'record',
          systemName: 'record',
          operationData: {},
          instance: function (this: IOperationScope, data: any) {
            recorded.push(this.currentItem);
            return Promise.resolve(data);
          },
        },
        {
          id: 'end-loop',
          systemName: 'endForEach',
          operationData: {},
          instance: endForEach as any,
        },
      ],
      [
        {
          id: 'end-op',
          systemName: 'endOp',
          operationData: {},
          instance: function (this: IOperationScope, data: any) {
            endOperationsSeen.push(this.operations);
            return data;
          },
        },
      ],
      new Eventbus()
    );

    // test
    const started = action.start();
    await action.end();
    await started;

    // expect
    expect(recorded).toEqual([1, 2, 3]);
    expect(endOperationsSeen).toEqual([action.endOperations]);
  });

  describe('operation context on errors', () => {
    function op(
      systemName: string,
      instance: (...args: any[]) => any,
      operationData: Record<string, unknown> = {}
    ): IResolvedOperation {
      return {id: systemName, systemName, operationData, instance} as any;
    }
    const silenceLog = () =>
      vi.spyOn(console, 'error').mockImplementation(() => {});

    test('given the second operation throws synchronously, when start is called, then the error carries that operation name and index', async () => {
      silenceLog();
      const failure = new Error('boom');
      const action = new Action(
        'ctx',
        [
          op('first', data => data),
          op('second', () => {
            throw failure;
          }),
        ],
        new Eventbus()
      );

      const error: any = await action.start().catch(e => e);

      expect(error).toBe(failure);
      expect(error.operationSystemName).toBe('second');
      expect(error.operationIndex).toBe(1);
    });

    test('given the third operation returns a rejected promise, when start is called, then the error carries that operation name and index', async () => {
      silenceLog();
      const action = new Action(
        'ctx',
        [
          op('first', async data => data),
          op('second', data => data),
          op('third', () => Promise.reject(new Error('async boom'))),
        ],
        new Eventbus()
      );

      const error: any = await action.start().catch(e => e);

      expect(error.message).toBe('async boom');
      expect(error.operationSystemName).toBe('third');
      expect(error.operationIndex).toBe(2);
    });

    test('given an operation that throws a string, when start is called, then it rejects with an Error that keeps the message and carries the operation context', async () => {
      silenceLog();
      const action = new Action(
        'ctx',
        [
          op('only', () => {
            throw 'plain string';
          }),
        ],
        new Eventbus()
      );

      const error: any = await action.start().catch(e => e);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('plain string');
      expect(error.operationSystemName).toBe('only');
      expect(error.operationIndex).toBe(0);
    });

    test('given configured operation data with its own __proto__ key, when start is called, then it rejects naming the operation and no prototype is replaced', async () => {
      silenceLog();
      const seen: object[] = [];
      const operationData = JSON.parse('{"__proto__": {"polluted": true}}');
      const action = new Action(
        'ctx',
        [
          op(
            'victim',
            data => {
              seen.push(data);
              return data;
            },
            operationData
          ),
        ],
        new Eventbus()
      );

      const error: any = await action.start().catch(e => e);

      expect(error.message).toMatch(/victim/);
      expect(error.message).toMatch(/__proto__/);
      expect(seen).toHaveLength(0);
      expect(({} as any).polluted).toBeUndefined();
    });

    test.each([
      [
        'a nested object',
        '{"properties": {"style": {"__proto__": {"polluted": true}}}}',
        'properties.style.__proto__',
      ],
      [
        'an object inside an array',
        '{"items": [1, {"__proto__": {"polluted": true}}]}',
        'items[1].__proto__',
      ],
    ])(
      'given configured operation data with a __proto__ key in %s, when start is called, then it rejects naming the operation and the path',
      async (_, json, path) => {
        silenceLog();
        const seen: object[] = [];
        const action = new Action(
          'ctx',
          [
            op(
              'victim',
              data => {
                seen.push(data);
                return data;
              },
              JSON.parse(json)
            ),
          ],
          new Eventbus()
        );

        const error: any = await action.start().catch(e => e);

        expect(error.message).toContain('victim');
        expect(error.message).toContain(path);
        expect(seen).toHaveLength(0);
        expect(({} as any).polluted).toBeUndefined();
      }
    );

    test('given configured operation data whose nested values are safe and include a class instance and a cycle, when start is called twice, then it runs normally', async () => {
      class Holder {
        value = 1;
      }
      const cyclic: Record<string, unknown> = {name: 'loop'};
      cyclic.self = cyclic;
      const seen: object[] = [];
      const action = new Action(
        'ctx',
        [
          op(
            'safe',
            data => {
              seen.push(data);
              return data;
            },
            {nested: {list: [{a: 1}]}, holder: new Holder(), cyclic}
          ),
        ],
        new Eventbus()
      );

      await action.start();
      await action.start();

      expect(seen).toHaveLength(2);
    });
  });
});
