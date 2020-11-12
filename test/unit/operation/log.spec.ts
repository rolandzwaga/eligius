import { expect } from 'chai';
import { log } from '~/operation/log';

describe('log', () => {
  let dirFunc;

  beforeAll(() => {
    dirFunc = console.dir;
  });

  afterAll(() => {
    console.dir = dirFunc;
  });

  it('should log the context and operation data', () => {
    // given
    const context = { context: true };
    const operationData = { data: true };
    const loggedLines = [];
    console.dir = (input) => {
      loggedLines.push(input);
    };

    // test
    log.call(context, operationData);

    // expect
    expect(loggedLines[0]).to.be.equal(context);
    expect(loggedLines[1]).to.be.equal(operationData);
  });
});
