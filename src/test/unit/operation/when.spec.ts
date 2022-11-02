import { expect } from 'chai';
import { suite } from 'uvu';
import { IOperationContext } from '../../../operation';
import { setGlobals } from '../../../operation/helper/globals';
import { IWhenOperationData, when } from '../../../operation/when';
import { applyOperation } from '../../../util/apply-operation';

const WhenSuite = suite<{
  operationContext: IOperationContext;
  operationData: IWhenOperationData & { left?: any; right?: any };
}>('when');

WhenSuite.before((context) => {
  context.operationContext = {
    skipNextOperation: false,
  } as any;
  context.operationData = {
    expression: '' as any,
  };
});

WhenSuite(
  'should set context.skipNextOperation to false when left and right numbers are equal',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '1==1';
    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left and right numbers are not equal',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '1==2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to false when left and right numbers are not equal and check is for inequality',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '1!=2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left and right numbers are equal and check is for inequality',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '1!=1';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to false when left number is greater than right',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '2>1';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left number is not greater than right',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '2<1';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to false when left number is greater or equal than right',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '2>=2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left number is not greater or equal than right',
  ({ operationContext, operationData }) => {
    // given
    operationData.expression = '1>=2';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to false when left operationdata value is equal to right operationdata value',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'foo';
    operationData.expression = 'operationdata.left==operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left operationdata value is not equal to right operationdata value',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'bar';
    operationData.expression = 'operationdata.left==operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left operationdata value is equal to right operationdata value and the check is for inequality',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'foo';
    operationData.expression = 'operationdata.left!=operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to false when left operationdata value is not equal to right operationdata value and the check is for inequality',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'bar';
    operationData.expression = 'operationdata.left!=operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to false when left operationdata value is greater than right operationdata value',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = 2;
    operationData.right = 1;
    operationData.expression = 'operationdata.left>operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.false;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left operationdata value is not greater than right operationdata value',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = 1;
    operationData.right = 2;
    operationData.expression = 'operationdata.left>operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left operationdata complex value is not greater than right operationdata value',
  ({ operationContext, operationData }) => {
    // given
    operationData.left = [];
    operationData.right = 2;
    operationData.expression = 'operationdata.left.length>operationdata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite(
  'should set context.skipNextOperation to true when left globaldata value is not equal to right globaldata value',
  ({ operationContext, operationData }) => {
    // given
    setGlobals({ left: 'foo', right: 'bar' });
    operationData.expression = 'globaldata.left==globaldata.right';

    // test
    applyOperation(when, operationData, operationContext);

    // expect
    expect(operationContext.skipNextOperation).to.be.true;
  }
);

WhenSuite.run();
