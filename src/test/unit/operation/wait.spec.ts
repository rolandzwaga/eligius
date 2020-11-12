import { expect } from 'chai';
import wait from '../../operation/wait';

describe('wait', () => {
  let timeout;
  let mseconds = 0;

  before(() => {
    mseconds = 0;
    timeout = setTimeout;
    global.setTimeout = function (func, ms) {
      mseconds = ms;
      func();
    };
  });

  after(() => {
    global.setTimeout = timeout;
  });

  it('should wait for the specified amount of milliseconds', () => {
    // given
    const operationData = {
      milliseconds: 1000,
    };

    // test
    const promise = wait(operationData);

    // expect
    promise.then((data) => {
      expect(data).to.equal(operationData);
      expect(mseconds).to.equal(operationData.milliseconds);
    });
    return promise;
  });
});
