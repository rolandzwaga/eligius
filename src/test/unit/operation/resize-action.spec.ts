import { expect } from 'chai';
import { TOperationData } from '../../../operation';
import { resizeAction } from '../../../operation/resize-action';
import { applyOperation } from './apply-operation';

class MockAction {
  operationData: any;
  resize(operationData: TOperationData) {
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
    const newData = applyOperation(resizeAction, operationData);

    // expect
    expect(mockAction.operationData).to.equal(newData);
  });
});
