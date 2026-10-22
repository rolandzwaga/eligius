import {TimelineAction} from '@action/timeline-action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

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

  test<TimelineActionSuiteContext>('should set active when start() is called without endOperations, so a second dispatch cannot start it twice', async context => {
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

    // expect - start-only actions are active until they are ended
    expect(action.active).toBe(true);
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

  test<TimelineActionSuiteContext>('given an action that has already ended, when end is called again, then its endOperations do not run again', async context => {
    // given
    const endOp = createMockOperation('end-1');
    const action = new TimelineAction(
      'TestAction',
      [createMockOperation('start-1')],
      [endOp],
      {start: 2, end: 5},
      context.eventbus
    );
    await action.start();
    await action.end({});

    // test
    await action.end({});

    // expect
    expect(endOp.instance).toHaveBeenCalledTimes(1);
  });

  test<TimelineActionSuiteContext>('given an action that never started, when end is called, then its endOperations do not run', async context => {
    // given
    const endOp = createMockOperation('end-1');
    const action = new TimelineAction(
      'TestAction',
      [createMockOperation('start-1')],
      [endOp],
      {start: 2, end: 5},
      context.eventbus
    );

    // test
    await action.end({});

    // expect
    expect(endOp.instance).not.toHaveBeenCalled();
  });

  test<TimelineActionSuiteContext>('given a start-only action that has started, when start is called again before it ends, then its startOperations run once', async context => {
    // given
    const startOp = createMockOperation('start-1');
    const action = new TimelineAction(
      'TestAction',
      [startOp],
      [],
      {start: 5, end: 10},
      context.eventbus
    );

    // test
    await action.start();
    await action.start();

    // expect
    expect(startOp.instance).toHaveBeenCalledTimes(1);
    expect(action.active).toBe(true);
  });

  test<TimelineActionSuiteContext>('given a start-only action that has started and ended, when start is called again, then its startOperations run again', async context => {
    // given
    const startOp = createMockOperation('start-1');
    const action = new TimelineAction(
      'TestAction',
      [startOp],
      [],
      {start: 5, end: 10},
      context.eventbus
    );
    await action.start();
    await action.end({});

    // test
    await action.start();

    // expect
    expect(startOp.instance).toHaveBeenCalledTimes(2);
  });
  describe('sequencing of start and end', () => {
    function deferred() {
      let resolve!: (value?: unknown) => void;
      const promise = new Promise(r => {
        resolve = r;
      });
      return {promise, resolve};
    }

    function op(id: string, instance: (data: any) => any): IResolvedOperation {
      return {id, systemName: id, operationData: {}, instance};
    }

    test<TimelineActionSuiteContext>('given start operations [async op awaiting a deferred, recordStart] and end operations [recordEnd], when end() is called before the deferred resolves, then recordEnd runs after recordStart', async context => {
      // given
      const log: string[] = [];
      const gate = deferred();
      const action = new TimelineAction(
        'Sequenced',
        [
          op('wait', data => gate.promise.then(() => data)),
          op('recordStart', data => {
            log.push('start');
            return data;
          }),
        ],
        [
          op('recordEnd', data => {
            log.push('end');
            return data;
          }),
        ],
        {start: 1, end: 1.1},
        context.eventbus
      );

      // test
      const started = action.start();
      const ended = action.end();
      expect(action.active).toBe(false);
      expect(log).toEqual([]);
      gate.resolve();
      await Promise.all([started, ended]);

      // expect
      expect(log).toEqual(['start', 'end']);
    });

    test<TimelineActionSuiteContext>('given an end whose operations are still running, when start() is called again (loop wrap), then the start operations run after the end operations finished', async context => {
      // given
      const log: string[] = [];
      const gate = deferred();
      const action = new TimelineAction(
        'Wrapped',
        [
          op('recordStart', data => {
            log.push('start');
            return data;
          }),
        ],
        [
          op('fadeOut', data => gate.promise.then(() => data)),
          op('recordEnd', data => {
            log.push('end');
            return data;
          }),
        ],
        {start: 0, end: 10},
        context.eventbus
      );
      await action.start();

      // test
      const ended = action.end();
      const restarted = action.start();
      expect(action.active).toBe(true);
      await Promise.resolve();
      expect(log).toEqual(['start']);
      gate.resolve();
      await Promise.all([ended, restarted]);

      // expect
      expect(log).toEqual(['start', 'end', 'start']);
    });

    test<TimelineActionSuiteContext>('given synchronous start and end operations, when start() and end() are called back to back, then both run synchronously', context => {
      // given
      const log: string[] = [];
      const action = new TimelineAction(
        'Sync',
        [
          op('recordStart', data => {
            log.push('start');
            return data;
          }),
        ],
        [
          op('recordEnd', data => {
            log.push('end');
            return data;
          }),
        ],
        {start: 0, end: 1},
        context.eventbus
      );

      // test
      action.start();
      action.end();

      // expect
      expect(log).toEqual(['start', 'end']);
    });

    test<TimelineActionSuiteContext>('given a start that fails asynchronously, when end() was queued behind it, then the end still runs and only the start rejects', async context => {
      // given
      const log: string[] = [];
      const action = new TimelineAction(
        'Failing',
        [op('fail', () => Promise.reject(new Error('boom')))],
        [
          op('recordEnd', data => {
            log.push('end');
            return data;
          }),
        ],
        {start: 0, end: 1},
        context.eventbus
      );

      // test
      const started = action.start();
      const ended = action.end();

      // expect
      await expect(started).rejects.toThrow('boom');
      await expect(ended).resolves.toBeDefined();
      expect(log).toEqual(['end']);
    });

    test<TimelineActionSuiteContext>('given a start-only action whose start is still running, when end() and start() are queued behind it, then the queue drains and every promise settles', async context => {
      // given
      const gate = deferred();
      const startOp = vi.fn((data: any) => gate.promise.then(() => data));
      const action = new TimelineAction(
        'StartOnly',
        [op('wait', startOp)],
        [],
        {start: 0, end: 1},
        context.eventbus
      );

      // test
      const first = action.start();
      const ended = action.end();
      const second = action.start();
      gate.resolve();
      await Promise.all([first, ended, second]);

      // expect
      expect(startOp).toHaveBeenCalledTimes(2);
      expect(action.active).toBe(true);
    });
  });
});
