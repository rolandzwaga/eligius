import { expect } from 'chai';
import resizeAction from '../../operation/resizeAction';

class MockAction {
  resize(operationData) {
    return (this.operationData = operationData);
  }
}

describe('resizeAction', () => {
  it('should call the resize method on an action if it exists', () => {
    // given
    const mockAction = new MockAction();
    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        test: true,
      },
    };

    // test
    const newData = resizeAction(operationData);

    // expect
    expect(mockAction.operationData).to.equal(newData);
  });
});
