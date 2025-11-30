import type {IController} from '@controllers/types.ts';
import {
  type IInvokeObjectMethodOperationData,
  invokeObjectMethod,
} from '@operation/invoke-object-method.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('invokeObjectMethod', () => {
  test('should call the specified method on the given object', () => {
    // given
    const controller = {
      testMethod: (input: number) => input * 2,
    };
    const operationData: IInvokeObjectMethodOperationData = {
      instance: controller as any as IController<any>,
      methodName: 'testMethod',
      methodArguments: [10],
    };

    // test
    const result = applyOperation(invokeObjectMethod, operationData);

    // expect
    expect(result.methodResult).toBe(20);
  });

  test('should remove the methodName and methodArguments from the operation data', () => {
    // given
    const controller = {
      testMethod: (input: number) => input * 2,
    };
    const operationData: IInvokeObjectMethodOperationData = {
      instance: controller as any as IController<any>,
      methodName: 'testMethod',
      methodArguments: [10],
    };

    // test
    const result = applyOperation(invokeObjectMethod, operationData);

    // expect
    expect('methodName' in result).toBe(false);
    expect('methodArguments' in result).toBe(false);
  });
});
