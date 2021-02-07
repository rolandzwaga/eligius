import { expect } from 'chai';
import { Action } from '../../action';
import { IAction } from '../../action/types';
import { IResolvedOperation } from '../../configuration/types';
import { Eventbus } from '../../eventbus';
import { endLoop } from '../../operation/end-loop';
import { startLoop, TStartLoopOperationData } from '../../operation/start-loop';

describe('Start and end loop', () => {
  let action: IAction = new Action('bla', [], {} as any);
  let eventBus: Eventbus | null = null;

  beforeEach(() => {
    const startOperations: any[] = [];
    eventBus = new Eventbus();
    action = new Action('test', startOperations, eventBus);
  });

  it('should loop the given operation 10 times', (done) => {
    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        collection: testCollection,
        propertyName: 'value',
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
        op.newCollection.push(op.value);
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
    action
      .start()
      .then((operationData) => {
        // expect
        expect(operationData.newCollection.length).to.be.equal(testCollection.length);
        operationData.newCollection.forEach((letter: string, index: number) => {
          expect(letter).to.be.equal(testCollection[index]);
        });
        done();
      })
      .catch(() => {
        done();
      });
  });

  it('should loop the given async operation 10 times', (done) => {
    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const op1 = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        collection: testCollection,
        propertyName: 'value',
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
        op.newCollection.push(op.value);
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
    action
      .start()
      .then((operationData) => {
        // expect
        expect(operationData.newCollection.length).to.be.equal(testCollection.length);
        operationData.newCollection.forEach((letter: string, index: number) => {
          expect(letter).to.be.equal(testCollection[index]);
        });
        done();
      })
      .catch(() => {
        done();
      });
  });

  it('should skip the loop for an empty collection', (done) => {
    const testCollection: any[] = [];
    const op1 = {
      id: 'id1',
      systemName: 'systemName1',
      operationData: {
        collection: testCollection,
        propertyName: 'value',
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
        op.newCollection.push(op.value);
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
    action
      .start()
      .then((operationData) => {
        // expect
        expect(operationData.newCollection).to.be.undefined;
        expect(operationData.test).to.be.true;
        done();
      })
      .catch(() => {
        done();
      });
  });

  it('should skip the loop for a null collection', (done) => {
    const testCollection: any[] | null = null;
    const op1: IResolvedOperation = {
      id: 'id1',
      systemName: 'systemNam1',
      operationData: {
        collection: testCollection,
        propertyName: 'value',
      } as TStartLoopOperationData,
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
        op.newCollection.push(op.value);
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
    action
      .start()
      .then((operationData) => {
        // expect
        expect(operationData.newCollection).to.be.undefined;
        expect(operationData.test).to.be.true;
        done();
      })
      .catch(() => {
        done();
      });
  });
});
