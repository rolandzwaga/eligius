import {wait} from '@operation/wait.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type TestContext,
  test,
} from 'vitest';

type WaitSuiteContext = {
  timeout: typeof window.setTimeout;
  mseconds: number;
} & TestContext;

describe<WaitSuiteContext>('wait', () => {
  beforeEach<WaitSuiteContext>(context => {
    context.mseconds = 0;
    context.timeout = window.setTimeout;
    global.setTimeout = ((func: Function, ms: number) => {
      context.mseconds = ms;
      func();
    }) as any;
  });
  afterEach<WaitSuiteContext>(context => {
    global.setTimeout = context.timeout;
    delete (context as any).timeout;
  });
  test<WaitSuiteContext>('should wait for the specified amount of milliseconds', async context => {
    // given
    const operationData = {
      milliseconds: 1000,
    };

    // test
    const data = await applyOperation(wait, operationData);

    // expect
    expect(data).toEqual({});
    expect(context.mseconds).toBe(1000);
  });

  test<WaitSuiteContext>('should remove the milliseconds property from the operation', async context => {
    // given
    const operationData = {
      milliseconds: 1000,
    };

    // test
    const data = await applyOperation(wait, operationData);

    // expect
    expect('milliseconds' in data).toBe(false);
  });
});
