import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { IController } from '../../../controllers/types.ts';
import {
  type IInvokeObjectMethodOperationData,
  invokeObjectMethod,
} from '../../../operation/invoke-object-method.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe.concurrent('invokeObjectMethod', () => {
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
    const result = applyOperation<IInvokeObjectMethodOperationData>(
      invokeObjectMethod,
      operationData
    );

    // expect
    expect(result.methodResult).to.equal(20);
  });
});
