import { expect } from 'chai';
import { beforeEach, describe, type TestContext, test } from 'vitest';
import type { IResolvedOperation } from '../../../configuration/types.ts';
import { setGlobals } from '../../../operation/helper/globals.ts';
import type { IOperationContext } from '../../../operation/index.ts';
import { type IWhenOperationData, when } from '../../../operation/when.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

type WhenSuiteContext = {
  operationContext: IOperationContext;
  operationData: IWhenOperationData & { left?: any; right?: any; };
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe<WhenSuiteContext>('when', () => {
  beforeEach(context => {
    withContext<WhenSuiteContext>(context);

    context.operationContext = {
      currentIndex: 0,
      operations: [],
    } as any;
    context.operationData = {
      expression: '' as any,
    };
  });
  test<WhenSuiteContext>('should leave newIndex undefined when left and right numbers are equal', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '1==1';
    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to zero when left and right numbers are not equal', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '1==2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left and right numbers are not equal and check is for inequality', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '1!=2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to zero when left and right numbers are equal and check is for inequality', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '1!=1';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left number is greater than right', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '2>1';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to zero when left number is not greater than right', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '2<1';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left number is greater or equal than right', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '2>=2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to zero when left number is not greater or equal than right', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.expression = '1>=2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left operationdata value is equal to right operationdata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'foo';
    operationData.expression = 'operationdata.left==operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata value is not equal to right operationdata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'bar';
    operationData.expression = 'operationdata.left==operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata value is equal to right operationdata value and the check is for inequality', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'foo';
    operationData.expression = 'operationdata.left!=operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left operationdata value is not equal to right operationdata value and the check is for inequality', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'bar';
    operationData.expression = 'operationdata.left!=operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left operationdata value is greater than right operationdata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = 2;
    operationData.right = 1;
    operationData.expression = 'operationdata.left>operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata value is not greater than right operationdata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = 1;
    operationData.right = 2;
    operationData.expression = 'operationdata.left>operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata complex value is not greater than right operationdata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationData.left = [];
    operationData.right = 2;
    operationData.expression = 'operationdata.left.length>operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left globaldata value is not equal to right globaldata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    setGlobals({ left: 'foo', right: 'bar' });
    operationData.expression = 'globaldata.left==globaldata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left globaldata value is not equal to right globaldata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationContext.currentItem = {
      left: 'foo',
      right: 'bar',
    };
    operationData.expression =
      'context.currentItem.left==context.currentItem.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });
  test<WhenSuiteContext>('should set newIndex to endWhen index when left globaldata value is not equal to right globaldata value', ({
    operationContext,
    operationData,
  }) => {
    // given
    setGlobals({ left: 'foo', right: 'bar' });

    operationData.expression = 'globaldata.left==globaldata.right';

    operationContext.operations.push({
      systemName: 'when',
    } as IResolvedOperation);
    operationContext.operations.push({
      systemName: 'selectElement',
    } as IResolvedOperation);
    operationContext.operations.push({
      systemName: 'endWhen',
    } as IResolvedOperation);

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(2);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left variable value is not equal to right variable value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationContext.variables = {
      left: 1,
      right: 2
    };

    operationData.expression =
      '@left==@right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.equal(0);
  });

  test<WhenSuiteContext>('should leave newIndex undefined when left variable value is equal to right variable value', ({
    operationContext,
    operationData,
  }) => {
    // given
    operationContext.variables = {
      left: 1,
      right: 1
    };

    operationData.expression =
      '@left==@right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.newIndex).to.be.undefined;
  });

});
