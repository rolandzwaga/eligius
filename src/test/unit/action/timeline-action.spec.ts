import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {TimelineAction} from '../../../action/timeline-action.ts';
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

type TimelineActionSuiteContext = {
  eventbus: IEventbus;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<TimelineActionSuiteContext>('TimelineAction', () => {
  beforeEach(context => {
    withContext<TimelineActionSuiteContext>(context);
    context.eventbus = new Eventbus();
  });

  test<TimelineActionSuiteContext>('should create TimelineAction with duration', context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps = [createMockOperation('end-1')];
    const duration = {start: 0, end: 10};

    // test
    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    // expect
    expect(action.name).toBe('TestAction');
    expect(action.duration).toBe(duration);
    expect(action.active).toBe(false);
  });

  test<TimelineActionSuiteContext>('should set active to true when start() is called with endOperations', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps = [createMockOperation('end-1')];
    const duration = {start: 0, end: 10};

    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    expect(action.active).toBe(false);

    // test
    await action.start();

    // expect
    expect(action.active).toBe(true);
  });

  test<TimelineActionSuiteContext>('should not set active when start() is called without endOperations', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps: IResolvedOperation[] = []; // No end operations
    const duration = {start: 0, end: 10};

    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    // test
    await action.start();

    // expect - active should remain false when no endOperations
    expect(action.active).toBe(false);
  });

  test<TimelineActionSuiteContext>('should return early when start() is called while already active', async context => {
    // given
    const {eventbus} = context;
    const startOp = createMockOperation('start-1');
    const startOps = [startOp];
    const endOps = [createMockOperation('end-1')];
    const duration = {start: 0, end: 10};

    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    // First call - should execute
    await action.start();
    expect(startOp.instance).toHaveBeenCalledTimes(1);

    // test - second call while active
    const result = await action.start();

    // expect - should return empty object and not execute again
    expect(result).toEqual({});
    expect(startOp.instance).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  test<TimelineActionSuiteContext>('should set active to false when end() is called', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOps = [createMockOperation('end-1')];
    const duration = {start: 0, end: 10};

    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    await action.start();
    expect(action.active).toBe(true);

    // test
    await action.end({});

    // expect
    expect(action.active).toBe(false);
  });

  test<TimelineActionSuiteContext>('should execute start operations with initOperationData', async context => {
    // given
    const {eventbus} = context;
    const startOp = createMockOperation('start-1', {processed: true});
    const startOps = [startOp];
    const endOps = [createMockOperation('end-1')];
    const duration = {start: 0, end: 10};

    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    const initData = {customData: 'test'};

    // test
    await action.start(initData);

    // expect
    expect(startOp.instance).toHaveBeenCalled();
  });

  test<TimelineActionSuiteContext>('should execute end operations and return result', async context => {
    // given
    const {eventbus} = context;
    const startOps = [createMockOperation('start-1')];
    const endOp = createMockOperation('end-1', {endResult: true});
    const endOps = [endOp];
    const duration = {start: 0, end: 10};

    const action = new TimelineAction(
      'TestAction',
      startOps,
      endOps,
      duration,
      eventbus
    );

    await action.start();

    // test
    const result = await action.end({initialData: true});

    // expect
    expect(endOp.instance).toHaveBeenCalled();
    expect(action.active).toBe(false);
  });
});
