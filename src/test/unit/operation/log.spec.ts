import { expect } from 'chai';
import { log } from '../../../operation/log';

describe('log', () => {
  let dirFunc: any;

  beforeAll(() => {
    dirFunc = console.dir;
  });

  afterAll(() => {
    window.console.dir = dirFunc;
  });

  it('should log the context and operation data', () => {
    // given
    const context = { context: true };
    const operationData: any = { data: true };
    const loggedLines: any[] = [];
    window.console.dir = (input: any) => {
      loggedLines.push(input);
    };

    // test
    log.call(context, operationData, {} as any);

    // expect
    expect(loggedLines[0]).to.eql({ context });
    expect(loggedLines[1]).to.eql({ operationData });
  });
});
