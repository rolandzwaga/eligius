import {expect, afterAll, afterEach, beforeAll, beforeEach, describe, type TestContext, test, } from 'vitest';
import type {
  IOperationScope,
  TOperationData,
} from '../../../operation/index.ts';
import {type ILogOperationData, log} from '../../../operation/log.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

type LogSuiteContext = {
  groupFunc: (message: any) => void;
  logFunc: (message?: any, ...optionalParams: any[]) => void;
  loggedLines: any[];
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<LogSuiteContext>('log', () => {
  beforeEach(context => {
    withContext<LogSuiteContext>(context);

    context.groupFunc = window.console.group;
    context.logFunc = window.console.log;
    context.loggedLines = [];
    window.console.log = (name: string, input: any) => {
      context.loggedLines.push({name, input});
    };
    window.console.group = () => {};
  });
  afterEach(context => {
    withContext<LogSuiteContext>(context);

    window.console.log = context.logFunc;
    window.console.group = context.groupFunc;
  });
  test<LogSuiteContext>('should log the context and operation data', ctx => {
    // given
    const scope: IOperationScope = {
      currentIndex: -1,
      eventbus: {} as any,
      operations: [],
    };
    const operationData: TOperationData = {data: true};

    // test
    applyOperation(log, operationData, scope);

    // expect
    expect(ctx.loggedLines[0]).toEqual({name: 'scope', input: scope});
    expect(ctx.loggedLines[1]).toEqual({
      name: 'operationData',
      input: operationData,
    });
  });

  test<LogSuiteContext>('should log the given value', ctx => {
    // given
    const scope: IOperationScope = {
      currentIndex: -1,
      eventbus: {} as any,
      operations: [],
    };
    const operationData: ILogOperationData = {logValue: 'foo'};

    // test
    applyOperation(log, operationData, scope);

    // expect
    expect(ctx.loggedLines[0]).toEqual({name: 'logValue', input: 'foo'});
  });

  test<LogSuiteContext>('should remove the logValue from the operation data', ctx => {
    // given
    const scope: IOperationScope = {
      currentIndex: -1,
      eventbus: {} as any,
      operations: [],
    };
    const operationData: ILogOperationData = {logValue: 'foo'};

    // test
    const newData = applyOperation(log, operationData, scope);

    // expect
    expect('logValue' in newData).toBe(false);
  });
});
