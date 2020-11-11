import { expect } from 'chai';
import startAction from '../../operation/startAction';

class MockAction {
  start(operationData) {
    return new Promise((resolve) => {
      operationData.resolved = true;
      resolve(operationData);
    });
  }
}

describe('startAction', () => {
  it('should start the specified action', () => {
    // given

    const mockAction = new MockAction();

    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const promise = startAction(operationData);

    // expect
    promise.then((result) => {
      expect(result.resolved).to.be.true;
      expect(result.prop).to.equal('test');
    });
    return promise;
  });
});
