import { expect } from 'chai';
import { suite } from 'uvu';
import { TOperationData } from '../../../operation';
import { resizeAction } from '../../../operation/resize-action';
import { applyOperation } from '../../../util/apply-operation';

class MockAction {
  operationData: any;
  resize(operationData: TOperationData) {
    return (this.operationData = operationData);
  }
}

const ResizeActionSuite = suite('resizeAction');

ResizeActionSuite(
  'should call the resize method on an action if it exists',
  () => {
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
  }
);

ResizeActionSuite.run();
