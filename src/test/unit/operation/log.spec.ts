/**
 * @jest-environment jsdom
 */

import { expect } from 'chai';
import { InspectOptions } from 'util';
import { suite } from 'uvu';
import { TOperationData } from '../../../operation';
import { log } from '../../../operation/log';
import { applyOperation } from '../../../util/apply-operation';

const LogSuite =
  suite<{ dirFunc: (obj: any, options?: InspectOptions) => void }>('log');

LogSuite.before((context) => {
  context.dirFunc = console.dir;
});

LogSuite.after((context) => {
  window.console.dir = context.dirFunc;
});

LogSuite('should log the context and operation data', () => {
  // given
  const context = { currentIndex: -1, eventbus: {} as any };
  const operationData: TOperationData = { data: true };
  const loggedLines: any[] = [];
  window.console.dir = (input: any) => {
    loggedLines.push(input);
  };

  // test
  applyOperation(log, operationData, context);

  // expect
  expect(loggedLines[0]).to.eql({ context });
  expect(loggedLines[1]).to.eql({ operationData });
});

LogSuite.run();
