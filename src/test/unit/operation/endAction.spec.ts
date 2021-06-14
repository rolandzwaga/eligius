import { expect } from 'chai';
import { endAction } from '../../../operation/end-action';

class MockAction {
  end(operationData) {
    return new Promise(resolve => {
      resolve(operationData);
    });
  }
}

describe('endAction', () => {
  it('should call the end() method on the given action with the given operationdata', () => {
    // given
    const mockAction = new MockAction();

    const operationData = {
      actionInstance: mockAction as any,
      actionOperationData: {
        test: true,
      },
    };

    // test
    const promise = endAction(operationData, {} as any) as Promise<any>;

    return promise.then(result => {
      expect(result).to.equal(operationData);
    });
  });
});
