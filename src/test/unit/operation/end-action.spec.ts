import {expect, describe, test} from 'vitest';
import {endAction} from '../../../operation/end-action.ts';
import type {TOperation} from '../../../operation/index.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

class MockAction {
  end(operationData: TOperation) {
    return new Promise(resolve => {
      resolve(operationData);
    });
  }
}

describe('endAction', () => {
  test('should call the end() method on the given action with the given operationdata', async () => {
    // given
    const mockAction = new MockAction();

    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        test: true,
      },
    };

    // test
    const result = await applyOperation(endAction, operationData);

    delete (operationData as any).actionOperationData;

    expect(result).toEqual(operationData);
  });
});
