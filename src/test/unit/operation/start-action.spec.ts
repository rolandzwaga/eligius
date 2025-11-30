import {expect, describe, test} from 'vitest';
import type {IAction} from '../../../action/types.ts';
import type {TOperationData} from '../../../operation/index.ts';
import {startAction} from '../../../operation/start-action.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

class MockAction {
  resolved: boolean = false;
  start(operationData: TOperationData) {
    this.resolved = true;
    return new Promise(resolve => {
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
      resolved: false,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const result = await applyOperation(startAction, operationData);

    // expect
    //expect(result.resolved).toBe(true);
    expect((mockAction as any).resolved).toBe(true);
    expect((result as any).actionOperationData).toBeUndefined();
    return result;
  });

  test('should remove the actionOperationData property from tghe operation data', async () => {
    // given
    const mockAction = new MockAction() as unknown as IAction;

    const operationData = {
      actionInstance: mockAction,
      resolved: false,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const result = await applyOperation(startAction, operationData);

    // expect
    //expect(result.resolved).toBe(true);
    expect('actionOperationData' in result).toBe(false);
    return result;
  });
});
