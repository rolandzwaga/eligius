import { expect } from 'chai';
import { afterEach, beforeEach, describe, test, type TestContext } from 'vitest';
import { wait } from '../../../operation/wait.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

type WaitSuiteContext = { timeout: typeof window.setTimeout; mseconds: number } & TestContext;

describe.concurrent<WaitSuiteContext>('wait', () => {
  beforeEach<WaitSuiteContext>((context) => {
    context.mseconds = 0;
    context.timeout = window.setTimeout;
    global.setTimeout = function(func: Function, ms: number) {
      context.mseconds = ms;
      func();
    } as any;
  });
  afterEach<WaitSuiteContext>((context) => {

    global.setTimeout = context.timeout;
    delete (context as any).timeout;
  });
  test<WaitSuiteContext>('should wait for the specified amount of milliseconds', async (context) => {
    // given
    const operationData = {
      milliseconds: 1000,
    };

    // test
    const data = await applyOperation(wait, operationData);

    // expect
    expect(data).to.eql({});
    expect(context.mseconds).to.equal(1000);
  });
});
