import { expect } from 'chai';
import { suite } from 'uvu';
import { Action } from '../../action';
import { Eventbus } from '../../eventbus';
import { otherwise } from '../../operation';
import { endWhen } from '../../operation/end-when';
import { IWhenOperationData, when } from '../../operation/when';

const WhenConstruction = suite<{ action: Action }>('whenConstruction');

WhenConstruction.before.each((context) => {
  const eventBus = new Eventbus();
  context.action = new Action('test', [], eventBus);
});

WhenConstruction(
  'should set operationdata.foo to true because expression evaluates to true',
  async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        expression: '1==1',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.foo = true;
        console.log('op.foo', op.foo);
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
      operationData: {},
      instance: endWhen,
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.foo).to.be.true;
  }
);

WhenConstruction(
  'should leave operationdata.foo undefined because expression evaluates to false',
  async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        expression: '1==2',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.foo = true;
        console.log('op.foo', op.foo);
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
      operationData: {},
      instance: endWhen,
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.foo).to.be.undefined;
  }
);

WhenConstruction(
  'should continue executing after endWhen when expression evaluates to false',
  async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        expression: '1==2',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
      operationData: {},
      instance: endWhen,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam3',
      operationData: {},
      instance: function (op: any) {
        op.continued = true;
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);
    action.startOperations.push(op4);

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.foo).to.be.undefined;
    expect(operationData?.continued).to.be.true;
  }
);

WhenConstruction(
  'should continue executing after otherwise when expression evaluates to false',
  async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        expression: '1==2',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
      operationData: {},
      instance: otherwise,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.bar = true;
        return op;
      },
    };
    const op5 = {
      id: 'id5',
      systemName: 'systemNam3',
      operationData: {},
      instance: endWhen,
    };
    const op6 = {
      id: 'id6',
      systemName: 'systemNam3',
      operationData: {},
      instance: function (op: any) {
        op.continued = true;
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);
    action.startOperations.push(op4);
    action.startOperations.push(op5);
    action.startOperations.push(op6);

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.foo).to.be.undefined;
    expect(operationData?.bar).to.be.true;
    expect(operationData?.continued).to.be.true;
  }
);

WhenConstruction(
  'should stop executing after otherwise when expression evaluates to true',
  async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        expression: '1==1',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
      operationData: {},
      instance: otherwise,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        op.bar = true;
        return op;
      },
    };
    const op5 = {
      id: 'id5',
      systemName: 'systemNam3',
      operationData: {},
      instance: endWhen,
    };
    const op6 = {
      id: 'id6',
      systemName: 'systemNam3',
      operationData: {},
      instance: function (op: any) {
        op.continued = true;
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);
    action.startOperations.push(op4);
    action.startOperations.push(op5);
    action.startOperations.push(op6);

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.foo).to.be.true;
    expect(operationData?.bar).to.be.undefined;
    expect(operationData?.continued).to.be.true;
  }
);

WhenConstruction.run();
