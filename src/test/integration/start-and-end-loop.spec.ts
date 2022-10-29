import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Action } from '../../action';
import { IResolvedOperation } from '../../configuration/types';
import { Eventbus } from '../../eventbus';
import { endLoop } from '../../operation/end-loop';
import { startLoop, TStartLoopOperationData } from '../../operation/start-loop';

global.cancelAnimationFrame = () => {};

const StartEndLoop = suite('Start and end loop');

StartEndLoop.before.each((context) => {
  const eventBus = new Eventbus();
  context.action = new Action('test', [], eventBus);
});

StartEndLoop('should loop the given operation 10 times', async (context) => {
  const { action } = context;

  const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const op1 = {
    id: 'id1',
    systemName: 'systemNam1',
    operationData: {
      collection: testCollection,
    },
    instance: startLoop,
  };
  const op2 = {
    id: 'id2',
    systemName: 'systemNam2',
    operationData: {},
    instance: function (op: any) {
      if (!op.newCollection) {
        op.newCollection = [];
      }
      op.newCollection.push(op.currentItem);
      return op;
    },
  };
  const op3 = {
    id: 'id3',
    systemName: 'systemNam3',
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
});

StartEndLoop(
  'should loop the given async operation 10 times',
  async (context) => {
    const { action } = context;

    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        collection: testCollection,
      },
      instance: startLoop,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(op.currentItem);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(op);
          }, 10);
        });
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
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
      systemName: 'systemName1',
      operationData: {
        collection: testCollection,
      },
      instance: startLoop,
    };
    const op2 = {
      id: 'id2',
      systemName: 'systemNam2',
      operationData: {},
      instance: function (op: any) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(op.currentItem);
        return op;
      },
    };
    const op3 = {
      id: 'id3',
      systemName: 'systemNam3',
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
    systemName: 'systemNam1',
    operationData: {
      collection: testCollection,
    } as unknown as TStartLoopOperationData,
    instance: startLoop,
  };
  const op2: IResolvedOperation = {
    id: 'id2',
    systemName: 'systemNam2',
    operationData: {} as any,
    instance: function (op) {
      if (!op.newCollection) {
        op.newCollection = [];
      }
      op.newCollection.push(op.currentItem);
      return op;
    },
  };
  const op3: IResolvedOperation = {
    id: 'id3',
    systemName: 'systemNam3',
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

StartEndLoop.run();
