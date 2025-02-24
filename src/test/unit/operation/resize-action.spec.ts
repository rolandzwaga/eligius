import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { TOperationData } from '../../../operation/index.ts';
import { resizeAction } from '../../../operation/resize-action.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockAction {
  operationData: any;
  resize(operationData: TOperationData) {
    return (this.operationData = operationData);
  }
}

describe.concurrent('resizeAction', () => {
  test('should call the resize method on an action if it exists', () => {
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
