import type {IEventbus} from '@eventbus/index.ts';
import {customFunction} from '@operation/custom-function.ts';
import type {IOperationScope, TOperation} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

function createMockEventbusWithFunction(testFunction: Function) {
  return {
    request: vi.fn((_topic: string, _arg: string) => {
      return testFunction;
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
    expect(mockEventbus.request).toHaveBeenCalledWith(
      'request-function',
      'testName'
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

  test('given a custom function that synchronously returns its operationData object, when customFunction is applied, then it returns the operation data (systemName removed) instead of rejecting', async () => {
    // given
    const operationData: Record<string, any> = {
      systemName: 'double',
      x: 2,
    };
    const mockEventbus = createMockEventbusWithFunction(function (
      d: Record<string, any>
    ) {
      d.x = d.x * 2;
      return d;
    });

    // test
    const result = await applyOperation(customFunction, operationData as any, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(result).toEqual({x: 4});
  });

  test('given a custom function that returns a non-object truthy value, when customFunction is applied, then the operation data is returned', async () => {
    // given
    const operationData = {systemName: 'truthy', y: 1};
    const mockEventbus = createMockEventbusWithFunction(() => 42);

    // test
    const result = await applyOperation(customFunction, operationData as any, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(result).toEqual({y: 1});
  });
});
