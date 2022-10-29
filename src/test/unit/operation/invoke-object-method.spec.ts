import { expect } from 'chai';
import { suite } from 'uvu';
import { IController } from '../../../controllers/types';
import {
  IInvokeObjectMethodOperationData,
  invokeObjectMethod,
} from '../../../operation/invoke-object-method';
import { applyOperation } from '../../../util/apply-operation';

const InvokeObjectMethodSuite = suite('invokeObjectMethod');

InvokeObjectMethodSuite(
  'should call the specified method on the given object',
  () => {
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
  }
);

InvokeObjectMethodSuite.run();
