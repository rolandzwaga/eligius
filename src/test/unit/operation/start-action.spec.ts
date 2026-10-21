import type {IAction} from '@action/types.ts';
import type {TOperationData} from '@operation/index.ts';
import {startAction} from '@operation/start-action.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

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

  test('given startAction operation data without actionOperationData, when the action start resolves, then the returned promise resolves with the actionInstance and the operation data', async () => {
    // given
    const mockAction = new MockAction() as unknown as IAction;
    const operationData = {actionInstance: mockAction, other: 1} as any;

    // test
    const result = await Promise.race([
      applyOperation(startAction, operationData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('startAction hung')), 500)
      ),
    ]);

    // expect
    expect(result).toEqual({other: 1, actionInstance: mockAction});
  });

  test('given startAction operation data without actionInstance, when the operation runs, then it rejects with a clear error', async () => {
    // given
    const operationData = {actionOperationData: {}} as any;

    // test & expect
    await expect(applyOperation(startAction, operationData)).rejects.toThrow(
      'startAction: actionInstance is required'
    );
  });
});
