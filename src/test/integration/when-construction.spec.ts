import { expect } from 'chai';
import { beforeEach, describe, test, type TestContext } from 'vitest';
import { Action } from '../../action/index.ts';
import { Eventbus } from '../../eventbus/index.ts';
import { endWhen } from '../../operation/end-when.ts';
import { otherwise } from '../../operation/index.ts';
import { type IWhenOperationData, when } from '../../operation/when.ts';

type WhenConstructionContext = { action: Action } & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe.concurrent<WhenConstructionContext>('whenConstruction', () => {
  beforeEach((context) => {
    withContext<WhenConstructionContext>(context);

    const eventBus = new Eventbus();
    context.action = new Action('test', [], eventBus);
  });
  test<WhenConstructionContext>('should set operationdata.foo to true because expression evaluates to true', async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==1',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'endWhen',
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
  });
  test<WhenConstructionContext>('should leave operationdata.foo undefined because expression evaluates to false', async (context) => {
    const { action } = context;

    action.startOperations.push({
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==2',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.foo = true;
        return op;
      },
    });
    action.startOperations.push({
      id: 'id3',
      systemName: 'endWhen',
      operationData: {},
      instance: endWhen,
    });

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.foo).to.be.undefined;
  });
  test<WhenConstructionContext>('should continue executing after endWhen when expression evaluates to false', async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==2',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'endWhen',
      operationData: {},
      instance: endWhen,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam3',
      operationData: {},
      instance: function(op: any) {
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
  });
  test<WhenConstructionContext>('should continue executing after otherwise when expression evaluates to false', async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==2',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'otherwise',
      operationData: {},
      instance: otherwise,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.bar = true;
        return op;
      },
    };
    const op5 = {
      id: 'id5',
      systemName: 'endWhen',
      operationData: {},
      instance: endWhen,
    };
    const op6 = {
      id: 'id6',
      systemName: 'systemNam3',
      operationData: {},
      instance: function(op: any) {
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
  });
  test<WhenConstructionContext>('should stop executing after otherwise when expression evaluates to true', async (context) => {
    const { action } = context;

    const op1 = {
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==1',
      } as IWhenOperationData,
      instance: when,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.foo = true;
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'otherwise',
      operationData: {},
      instance: otherwise,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam2',
      operationData: {},
      instance: function(op: any) {
        op.bar = true;
        return op;
      },
    };
    const op5 = {
      id: 'id5',
      systemName: 'endWhen',
      operationData: {},
      instance: endWhen,
    };
    const op6 = {
      id: 'id6',
      systemName: 'systemNam3',
      operationData: {},
      instance: function(op: any) {
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
  });
  test<WhenConstructionContext>('should support nested when/otherwises with nested when evaluating to false', async (context) => {
    const { action } = context;

    action.startOperations.push({
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==1',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id2',
      systemName: 'when',
      operationData: {
        expression: '1==0',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id3',
      systemName: 'when',
      operationData: {},
      instance: function(op: any) {
        op.notSet = true;
        return op;
      },
    });
    action.startOperations.push({
      id: 'id4',
      systemName: 'when',
      operationData: {},
      instance: endWhen,
    });
    action.startOperations.push({
      id: 'id5',
      systemName: 'when',
      operationData: {},
      instance: endWhen,
    });

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.notSet).to.be.undefined;
  });
  test<WhenConstructionContext>("should support nested when/otherwises with inner 'when' evaluating to true", async (context) => {
    const { action } = context;

    action.startOperations.push({
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==1',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id2',
      systemName: 'when',
      operationData: {
        expression: '2==2',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id3',
      systemName: 'when',
      operationData: {},
      instance: function(op: any) {
        op.notSet = true;
        return op;
      },
    });
    action.startOperations.push({
      id: 'id4',
      systemName: 'when',
      operationData: {},
      instance: endWhen,
    });
    action.startOperations.push({
      id: 'id5',
      systemName: 'when',
      operationData: {},
      instance: endWhen,
    });

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.notSet).to.be.true;
  });
  test<WhenConstructionContext>("should support nested when/otherwises with outer 'when' evaluating to false", async (context) => {
    const { action } = context;

    action.startOperations.push({
      id: 'id1',
      systemName: 'when',
      operationData: {
        expression: '1==3',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id2',
      systemName: 'when',
      operationData: {
        expression: '2==2',
      } as IWhenOperationData,
      instance: when,
    });
    action.startOperations.push({
      id: 'id3',
      systemName: 'when',
      operationData: {},
      instance: function(op: any) {
        op.notSet = true;
        return op;
      },
    });
    action.startOperations.push({
      id: 'id4',
      systemName: 'when',
      operationData: {},
      instance: endWhen,
    });
    action.startOperations.push({
      id: 'id5',
      systemName: 'when',
      operationData: {},
      instance: endWhen,
    });

    // test
    const operationData = await action.start();

    // expect
    expect(operationData?.notSet).to.be.undefined;
  });
});
