import {wait} from '@operation/wait.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

type WaitSuiteContext = {
  mseconds: number;
} & TestContext;

describe<WaitSuiteContext>('wait', () => {
  beforeEach<WaitSuiteContext>(context => {
    context.mseconds = 0;
    vi.stubGlobal('setTimeout', (func: Function, ms: number) => {
      context.mseconds = ms;
      func();
    });
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
