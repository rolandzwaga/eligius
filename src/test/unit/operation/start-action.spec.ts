import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { IAction } from '../../../action/types.ts';
import type { TOperationData } from '../../../operation/index.ts';
import { startAction } from '../../../operation/start-action.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockAction {
  start(operationData: TOperationData) {
    return new Promise((resolve) => {
      operationData.resolved = true;
      resolve(operationData);
    });
  }
}

describe('startAction', () => {
  test('should start the specified action', async () => {
    // given
    const mockAction = new MockAction() as unknown as IAction;

    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const result = await applyOperation<Promise<any>>(startAction, operationData);

    // expect
    expect(result.resolved).to.be.true;
    expect(result.prop).to.be.undefined;
    return result;
  });
});
