import {Action} from '@action/index.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/index.ts';
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
});
