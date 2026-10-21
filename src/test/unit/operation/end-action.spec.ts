import {endAction} from '@operation/end-action.ts';
import type {TOperation} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

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

  test('given no actionOperationData, when endAction runs, then it ends the action and resolves instead of hanging', async () => {
    const mockAction = new MockAction();
    const endSpy = vi.spyOn(mockAction, 'end');

    const result = await withTimeout(
      Promise.resolve(
        applyOperation(endAction, {actionInstance: mockAction} as any)
      )
    );

    expect(endSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({actionInstance: mockAction});
  });

  test('given no actionInstance, when endAction runs, then it rejects with an error naming the operation', async () => {
    await expect(
      applyOperation(endAction, {actionOperationData: {}} as any)
    ).rejects.toThrow('endAction: actionInstance is required');
  });

  test('given an action whose end() rejects, when endAction runs, then it rejects with that error', async () => {
    const failure = new Error('end failed');
    const failingAction = {end: () => Promise.reject(failure)};

    await expect(
      applyOperation(endAction, {
        actionInstance: failingAction,
        actionOperationData: {},
      } as any)
    ).rejects.toBe(failure);
  });
});

/** Fails the test instead of hanging when a promise never settles. */
function withTimeout<T>(promise: Promise<T>, ms = 1000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`did not settle in ${ms}ms`)), ms)
    ),
  ]);
}
