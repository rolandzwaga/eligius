import { expect } from 'chai';
import { InspectOptions } from 'util';
import { TOperationData } from '../../../operation';
import { log } from '../../../operation/log';
import { applyOperation } from './apply-operation';

describe('log', () => {
  let dirFunc: (obj: any, options?: InspectOptions) => void;

  beforeAll(() => {
    dirFunc = console.dir;
  });

  afterAll(() => {
    window.console.dir = dirFunc;
  });

  it('should log the context and operation data', () => {
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
});
