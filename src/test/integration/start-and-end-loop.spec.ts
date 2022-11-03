import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Action } from '../../action';
import { IResolvedOperation } from '../../configuration/types';
import { Eventbus } from '../../eventbus';
import {
  endWhen,
  IOperationContext,
  TOperationData,
  when,
} from '../../operation';
import { endLoop } from '../../operation/end-loop';
import { startLoop, TStartLoopOperationData } from '../../operation/start-loop';

global.cancelAnimationFrame = () => {};

const StartEndLoop = suite<{ action: Action }>('Start and end loop');

StartEndLoop.before.each((context) => {
  const eventBus = new Eventbus();
  context.action = new Action('test', [], eventBus);
});

StartEndLoop('should loop the given operation 10 times', async (context) => {
  const { action } = context;

  const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const op1 = {
    id: 'id1',
    systemName: 'startLoop',
    operationData: {
      collection: testCollection,
    },
    instance: startLoop,
  };
  const op2 = {
    id: 'id2',
    systemName: 'systemNam2',
    operationData: {},
    instance: function (this: IOperationContext, op: any) {
      if (!op.newCollection) {
        op.newCollection = [];
      }
      op.newCollection.push(this.currentItem);
      return op;
    },
  };
  const op3 = {
    id: 'id3',
    systemName: 'endLoop',
    operationData: {},
    instance: endLoop,
  };
  action.startOperations.push(op1);
  action.startOperations.push(op2);
  action.startOperations.push(op3);

  // test
  const operationData = (await action.start()) as TOperationData;
  // expect
  assert.is(operationData.newCollection.length, testCollection.length);
  operationData.newCollection.forEach((letter: string, index: number) => {
    assert.is(letter, testCollection[index]);
  });
});

StartEndLoop(
  'should loop the given async operation 10 times',
  async (context) => {
    const { action } = context;

    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const op1 = {
      id: 'id1',
      systemName: 'startLoop',
      operationData: {
        collection: testCollection,
      },
      instance: startLoop,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (this: IOperationContext, op: any) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(this.currentItem);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(op);
          }, 10);
        });
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'endLoop',
      operationData: {},
      instance: endLoop,
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);

    // test
    const operationData = await action.start();
    // expect
    assert.is(operationData.newCollection.length, testCollection.length);
    operationData.newCollection.forEach((letter: string, index: number) => {
      assert.is(letter, testCollection[index]);
    });
  }
);

StartEndLoop(
  'should skip the loop for an empty collection',
  async (context) => {
    const { action } = context;

    const testCollection: any[] = [];
    const op1 = {
      id: 'id1',
      systemName: 'startLoop',
      operationData: {
        collection: testCollection,
      },
      instance: startLoop,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (this: IOperationContext, op: any) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(this.currentItem);
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'endLoop',
      operationData: {},
      instance: endLoop,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam4',
      operationData: { test: true },
      instance: (op: any) => op,
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);
    action.startOperations.push(op4);

    // test
    const operationData = await action.start();
    // expect
    assert.is(operationData.newCollection, undefined);
    assert.ok(operationData.test);
  }
);

StartEndLoop('should skip the loop for a null collection', async (context) => {
  const { action } = context;

  const testCollection: any[] | null = null;
  const op1: IResolvedOperation = {
    id: 'id1',
    systemName: 'startLoop',
    operationData: {
      collection: testCollection,
    } as unknown as TStartLoopOperationData,
    instance: startLoop,
  };
  const op2: IResolvedOperation = {
    id: 'id2',
    systemName: 'systemNam2',
    operationData: {} as any,
    instance: function (this: IOperationContext, op) {
      if (!op.newCollection) {
        op.newCollection = [];
      }
      op.newCollection.push(this.currentItem);
      return op;
    },
  };
  const op3: IResolvedOperation = {
    id: 'id3',
    systemName: 'endLoop',
    operationData: {},
    instance: endLoop,
  };
  const op4: IResolvedOperation = {
    id: 'id4',
    systemName: 'systemNam4',
    operationData: { test: true },
    instance: (op) => op,
  };
  action.startOperations.push(op1);
  action.startOperations.push(op2);
  action.startOperations.push(op3);
  action.startOperations.push(op4);

  // test
  const operationData = await action.start();
  // expect
  assert.is(operationData.newCollection, undefined);
  assert.ok(operationData.test);
});

StartEndLoop('should correctly handle nested loops', async (context) => {
  const { action } = context;

  const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const nestedTestCollection = ['k', 'l'];
  const op1 = {
    id: 'id1',
    systemName: 'startLoop',
    operationData: {
      collection: testCollection,
    },
    instance: startLoop,
  };
  const op2 = {
    id: 'id2',
    systemName: 'systemNam2',
    operationData: {},
    instance: function (this: IOperationContext, op: any) {
      if (!op.newCollection) {
        op.newCollection = [];
      }
      op.newCollection.push(this.currentItem);
      return op;
    },
  };
  const op3 = {
    id: 'id3',
    systemName: 'startLoop',
    operationData: {
      collection: nestedTestCollection,
    },
    instance: startLoop,
  };
  const op4 = {
    id: 'id4',
    systemName: 'systemNam2',
    operationData: {},
    instance: function (this: IOperationContext, op: any) {
      if (!op.newNestedCollection) {
        op.newNestedCollection = [];
      }
      op.newNestedCollection.push(this.currentItem);
      return op;
    },
  };
  const op5 = {
    id: 'id5',
    systemName: 'endLoop',
    operationData: {},
    instance: endLoop,
  };
  const op6 = {
    id: 'id6',
    systemName: 'endLoop',
    operationData: {},
    instance: endLoop,
  };
  action.startOperations.push(op1);
  action.startOperations.push(op2);
  action.startOperations.push(op3);
  action.startOperations.push(op4);
  action.startOperations.push(op5);
  action.startOperations.push(op6);

  // test
  const operationData = (await action.start()) as TOperationData;
  // expect
  assert.is(operationData.newCollection.length, testCollection.length);
  operationData.newCollection.forEach((letter: string, index: number) => {
    assert.is(letter, testCollection[index]);
  });
  assert.is(operationData.newNestedCollection.length, 20);
});

StartEndLoop(
  'should correctly handle nested loops with nested when/otherwise blocks',
  async (context) => {
    const { action } = context;

    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const nestedTestCollection = ['k', 'l'];
    const op1 = {
      id: 'id1',
      systemName: 'startLoop',
      operationData: {
        collection: testCollection,
      },
      instance: startLoop,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (this: IOperationContext, op: any) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(this.currentItem);
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'startLoop',
      operationData: {
        collection: nestedTestCollection,
      },
      instance: startLoop,
    };
    const op4 = {
      id: 'id4',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (this: IOperationContext, op: any) {
        if (!op.newNestedCollection) {
          op.newNestedCollection = [];
        }
        op.newNestedCollection.push(this.currentItem);
        return op;
      },
    };
    const op5 = {
      id: 'id5',
      systemName: 'endLoop',
      operationData: {},
      instance: endLoop,
    };
    const op6 = {
      id: 'id6',
      systemName: 'when',
      operationData: { expression: '1==1' },
      instance: when,
    };
    const op7 = {
      id: 'id7',
      systemName: 'systemName3',
      operationData: {},
      instance: function (op: any) {
        op.nestedWhen = true;
        return op;
      },
    };
    const op8 = {
      id: 'id8',
      systemName: 'endWhen',
      operationData: {},
      instance: endWhen,
    };
    const op9 = {
      id: 'id9',
      systemName: 'endLoop',
      operationData: {},
      instance: endLoop,
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);
    action.startOperations.push(op4);
    action.startOperations.push(op5);
    action.startOperations.push(op6);
    action.startOperations.push(op7);
    action.startOperations.push(op8);
    action.startOperations.push(op9);

    // test
    const operationData = (await action.start()) as TOperationData;
    // expect
    assert.is(operationData.newCollection.length, testCollection.length);
    operationData.newCollection.forEach((letter: string, index: number) => {
      assert.is(letter, testCollection[index]);
    });
    assert.is(operationData.newNestedCollection.length, 20);
    assert.is(operationData.nestedWhen, true);
  }
);

StartEndLoop.run();
