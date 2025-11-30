import type {IEventbus} from '@eventbus/index.ts';
import {customFunction} from '@operation/custom-function.ts';
import type {IOperationScope, TOperation} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

function createMockEventbusWithFunction(testFunction: Function) {
  return {
    broadcast: vi.fn((_eventName: string, args: any[]) => {
      args[1](testFunction);
    }),
  };
}

describe('customFunction', () => {
  test('should resolve and execute the specified function', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };

    let called = false;
    const mockEventbus = createMockEventbusWithFunction(function (
      this: IOperationScope,
      opData: TOperation
    ) {
      called = true;
      expect(opData).toBe(operationData);
      expect(this.eventbus).toBe(mockEventbus);
    });

    // test
    await applyOperation(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(called).toBe(true);
    expect(mockEventbus.broadcast).toHaveBeenCalledWith(
      'request-function',
      expect.any(Array)
    );
  });

  test('should resolve and execute the specified function that itself returns a promise', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const mockEventbus = createMockEventbusWithFunction(function (
      this: IOperationScope,
      opData: TOperation
    ) {
      return new Promise<void>(resolve => {
        called = true;
        expect(opData).toBe(operationData);
        expect(this.eventbus).toBe(mockEventbus);
        resolve();
      });
    });

    // test
    const result = await applyOperation(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(called).toBe(true);
    return result;
  });

  test('should remove the systemName property from the operation data', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const mockEventbus = createMockEventbusWithFunction(function (
      this: IOperationScope,
      opData: TOperation
    ) {
      return new Promise<void>(resolve => {
        called = true;
        expect(opData).toBe(operationData);
        expect(this.eventbus).toBe(mockEventbus);
        resolve();
      });
    });

    // test
    const result = await applyOperation(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect('systemName' in result).toBe(false);
    return result;
  });
});
