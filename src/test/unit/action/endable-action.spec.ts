import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EndableAction} from '../../../action/endable-action.ts';
import type {IResolvedOperation} from '../../../configuration/types.ts';
import {Eventbus, type IEventbus} from '../../../eventbus/index.ts';

function createMockOperation(
  id: string,
  returnValue?: any
): IResolvedOperation {
  return {
    id,
    systemName: `operation-${id}`,
    operationData: {},
    instance: vi.fn().mockReturnValue(returnValue ?? {}),
  };
}

type EndableActionSuiteContext = {
  eventbus: IEventbus;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<EndableActionSuiteContext>('EndableAction', () => {
  beforeEach(context => {
    withContext<EndableActionSuiteContext>(context);
    context.eventbus = new Eventbus();
  });

  test<EndableActionSuiteContext>('should create EndableAction with start and end operations', context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps = [createMockOperation('end-1')];

    // test
    const action = new EndableAction('TestAction', startOps, endOps, eventbus);

    // expect
    expect(action.name).toBe('TestAction');
    expect(action.startOperations).toBe(startOps);
    expect(action.endOperations).toBe(endOps);
  });

  test<EndableActionSuiteContext>('should execute end operations', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOp = createMockOperation('end-1', {endResult: true});
    const endOps = [endOp];

    const action = new EndableAction('TestAction', startOps, endOps, eventbus);

    // test
    await action.end({});

    // expect
    expect(endOp.instance).toHaveBeenCalled();
  });

  test<EndableActionSuiteContext>('should return initOperationData when no end operations exist', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps: IResolvedOperation[] = [];

    const action = new EndableAction('TestAction', startOps, endOps, eventbus);
    const initData = {testData: 'value'};

    // test
    const result = await action.end(initData);

    // expect
    expect(result).toBe(initData);
  });

  test<EndableActionSuiteContext>('should return empty object when no end operations and no initData', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps: IResolvedOperation[] = [];

    const action = new EndableAction('TestAction', startOps, endOps, eventbus);

    // test
    const result = await action.end();

    // expect
    expect(result).toEqual({});
  });

  test<EndableActionSuiteContext>('should handle errors in end operations', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const errorOp: IResolvedOperation = {
      id: 'error-op',
      systemName: 'errorOperation',
      operationData: {},
      instance: vi.fn().mockImplementation(() => {
        throw new Error('End operation failed');
      }),
    };
    const endOps = [errorOp];

    const action = new EndableAction('TestAction', startOps, endOps, eventbus);

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // test & expect
    await expect(action.end({})).rejects.toThrow('End operation failed');
    expect(consoleSpy).toHaveBeenCalledWith("Error in action end 'TestAction'");

    consoleSpy.mockRestore();
  });

  test<EndableActionSuiteContext>('should execute end operations with initOperationData', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOp = createMockOperation('end-1');
    const endOps = [endOp];

    const action = new EndableAction('TestAction', startOps, endOps, eventbus);
    const initData = {customValue: 123};

    // test
    await action.end(initData);

    // expect
    expect(endOp.instance).toHaveBeenCalled();
  });
});
