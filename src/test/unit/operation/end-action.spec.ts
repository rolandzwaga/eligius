import { expect } from 'chai';
import { TOperation } from '../../../operation';
import { endAction } from '../../../operation/end-action';
import { applyOperation } from './apply-operation';

class MockAction {
  end(operationData: TOperation) {
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
      actionInstance: mockAction,
      actionOperationData: {
        test: true,
      },
    };

    // test
    const promise = applyOperation<Promise<typeof operationData>>(
      endAction,
      operationData
    );

    return promise.then(result => {
      expect(result).to.equal(operationData);
    });
  });
});
