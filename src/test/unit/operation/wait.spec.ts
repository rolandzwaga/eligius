import { expect } from 'chai';
import { wait } from '../../../operation/wait';

describe('wait', () => {
  const timeout = window.setTimeout;
  let mseconds = 0;

  beforeAll(() => {
    mseconds = 0;
    window.setTimeout = function (func, ms) {
      mseconds = ms;
      func();
    } as any;
  });

  afterAll(() => {
    window.setTimeout = timeout;
  });

  it('should wait for the specified amount of milliseconds', () => {
    // given
    const operationData = {
      milliseconds: 1000,
    };

    // test
    const promise = wait(operationData, {} as any) as Promise<any>;

    // expect
    promise.then((data) => {
      expect(data).to.equal(operationData);
      expect(mseconds).to.equal(operationData.milliseconds);
    });
    return promise;
  });
});
