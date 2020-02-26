require('jsdom-global')();
import { Action } from '../../src/action';
import { expect } from 'chai';

describe('Action', () => {
  let action = null;
  let eventBus = null;

  beforeEach(() => {
    const startOperations = [];
    eventBus = {};
    const actionConfiguration = {
      startOperations,
      name: 'test',
    };
    action = new Action(actionConfiguration, eventBus);
  });

  it('should create', () => {
    // given
    //test

    // expect
    expect(action.startOperations.length).to.equal(0);
    expect(action.name).to.equal('test');
    expect(action.eventbus).to.equal(eventBus);
  });

  it('should execute simple operations in sequence', done => {
    // given
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: op => {
        op.result = [op.value1];
        return op;
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: op => {
        op.result.push(op.value2);
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    action
      .start()
      .then(operationData => {
        // expect
        expect(operationData.result[0]).to.be.equal('op1');
        expect(operationData.result[1]).to.be.equal('op2');
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should execute async operations in sequence', done => {
    // given
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: op => {
        op.result = [op.value1];
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 500);
        });
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: op => {
        op.result.push(op.value2);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 200);
        });
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    action
      .start()
      .then(operationData => {
        // expect
        expect(operationData.result[0]).to.be.equal('op1');
        expect(operationData.result[1]).to.be.equal('op2');
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should execute async and simple operations mixed in sequence', done => {
    // given
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: op => {
        op.result = [op.value1];
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 500);
        });
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: op => {
        op.result.push(op.value2);
        return op;
      },
    };
    const opData3 = { value3: 'op3' };
    const op3 = {
      operationData: opData3,
      instance: op => {
        op.result.push(op.value3);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(op);
          }, 200);
        });
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);
    action.startOperations.push(op3);

    // test
    action
      .start()
      .then(operationData => {
        // expect
        expect(operationData.result[0]).to.be.equal('op1');
        expect(operationData.result[1]).to.be.equal('op2');
        expect(operationData.result[2]).to.be.equal('op3');
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should attach a context to the operation', done => {
    const opData = { value: 'op' };
    const op = {
      operationData: opData,
      instance: function(op) {
        const context = this;
        op.result = [];
        op.result.push(context);
        return op;
      },
    };
    action.startOperations.push(op);

    // test
    action
      .start()
      .then(operationData => {
        // expect
        expect(operationData.result[0]).to.not.be.undefined;
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should add current operation index number to the context given to the operation', done => {
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: function(op) {
        const context = this;
        op.result = [];
        op.result.push(context.currentIndex);
        return op;
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: function(op) {
        const context = this;
        op.result.push(context.currentIndex);
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    action
      .start()
      .then(operationData => {
        // expect
        expect(operationData.result[0]).to.be.equal(0);
        expect(operationData.result[1]).to.be.equal(1);
        done();
      })
      .catch(e => {
        done(e);
      });
  });
});
