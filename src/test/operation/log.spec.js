import { expect } from 'chai';
import log from '../../operation/log';

describe('log', () => {
  let dirFunc;

  before(() => {
    dirFunc = console.dir;
  });

  after(() => {
    console.dir = dirFunc;
  });

  it('should log the context and operation data', () => {
    // given
    const context = { context: true };
    const operationData = { data: true };
    const test = [];
    console.dir = (input) => {
      test.push(input);
    };

    // test
    log.call(context, operationData);

    // expect
    expect(test[0]).to.be.equal(context);
    expect(test[1]).to.be.equal(operationData);
  });
});
