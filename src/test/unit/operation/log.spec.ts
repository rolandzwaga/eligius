import { expect } from 'chai';
import { suite } from 'uvu';
import { IOperationContext, TOperationData } from '../../../operation';
import { log } from '../../../operation/log';
import { applyOperation } from '../../../util/apply-operation';

const LogSuite = suite<{
  groupFunc: (message: any) => void;
  logFunc: (message?: any, ...optionalParams: any[]) => void;
  loggedLines: any[];
}>('log');

LogSuite.before((context) => {
  context.groupFunc = window.console.group;
  context.logFunc = window.console.log;
  context.loggedLines = [];
  window.console.log = (name: string, input: any) => {
    context.loggedLines.push({ name, input });
  };
  window.console.group = () => {};
});

LogSuite.after((context) => {
  window.console.log = context.logFunc;
  window.console.group = context.groupFunc;
});

LogSuite('should log the context and operation data', (ctx) => {
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

LogSuite.run();
