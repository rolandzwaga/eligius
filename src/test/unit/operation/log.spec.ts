import { expect } from 'chai';
import { afterAll, afterEach, beforeAll, beforeEach, describe, test, type TestContext } from 'vitest';
import type { IOperationContext, TOperationData } from '../../../operation/index.ts';
import { log } from '../../../operation/log.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

type LogSuiteContext = {
  groupFunc: (message: any) => void;
  logFunc: (message?: any, ...optionalParams: any[]) => void;
  loggedLines: any[];
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe.concurrent<LogSuiteContext>('log', () => {
  beforeEach((context) => {
    withContext<LogSuiteContext>(context);

    context.groupFunc = window.console.group;
    context.logFunc = window.console.log;
    context.loggedLines = [];
    window.console.log = (name: string, input: any) => {
      context.loggedLines.push({ name, input });
    };
    window.console.group = () => { };
  });
  afterEach((context) => {
    withContext<LogSuiteContext>(context);

    window.console.log = context.logFunc;
    window.console.group = context.groupFunc;
  });
  test<LogSuiteContext>('should log the context and operation data', (ctx) => {
    // given
    const context: IOperationContext = {
      currentIndex: -1,
      eventbus: {} as any,
      operations: [],
    };
    const operationData: TOperationData = { data: true };

    // test
    applyOperation(log, operationData, context);

    // expect
    expect(ctx.loggedLines[0]).to.eql({ name: 'context', input: context });
    expect(ctx.loggedLines[1]).to.eql({
      name: 'operationData',
      input: operationData,
    });
  });
});
