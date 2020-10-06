require('jsdom-global')();
import { Action } from '../../action';
import { expect } from 'chai';
import { startLoop, endLoop } from '../../operation';

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

  it('should execute simple operations in sequence', (done) => {
    // given
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: (op) => {
        op.result = [op.value1];
        return op;
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: (op) => {
        op.result.push(op.value2);
        return op;
      },
    };
    action.startOperations.push(op1);
    action.startOperations.push(op2);

    // test
    action
      .start()
      .then((operationData) => {
        // expect
        expect(operationData.result[0]).to.be.equal('op1');
        expect(operationData.result[1]).to.be.equal('op2');
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should execute async operations in sequence', (done) => {
    // given
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: (op) => {
        op.result = [op.value1];
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(op);
          }, 500);
        });
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: (op) => {
        op.result.push(op.value2);
        return new Promise((resolve) => {
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
      .then((operationData) => {
        // expect
        expect(operationData.result[0]).to.be.equal('op1');
        expect(operationData.result[1]).to.be.equal('op2');
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should execute async and simple operations mixed in sequence', (done) => {
    // given
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: (op) => {
        op.result = [op.value1];
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(op);
          }, 500);
        });
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: (op) => {
        op.result.push(op.value2);
        return op;
      },
    };
    const opData3 = { value3: 'op3' };
    const op3 = {
      operationData: opData3,
      instance: (op) => {
        op.result.push(op.value3);
        return new Promise((resolve) => {
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
      .then((operationData) => {
        // expect
        expect(operationData.result[0]).to.be.equal('op1');
        expect(operationData.result[1]).to.be.equal('op2');
        expect(operationData.result[2]).to.be.equal('op3');
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should attach a context to the operation', (done) => {
    const opData = { value: 'op' };
    const op = {
      operationData: opData,
      instance: function (op) {
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
      .then((operationData) => {
        // expect
        expect(operationData.result[0]).to.not.be.undefined;
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should add current operation index number to the context given to the operation', (done) => {
    const opData1 = { value1: 'op1' };
    const op1 = {
      operationData: opData1,
      instance: function (op) {
        const context = this;
        op.result = [];
        op.result.push(context.currentIndex);
        return op;
      },
    };
    const opData2 = { value2: 'op2' };
    const op2 = {
      operationData: opData2,
      instance: function (op) {
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
      .then((operationData) => {
        // expect
        expect(operationData.result[0]).to.be.equal(0);
        expect(operationData.result[1]).to.be.equal(1);
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should loop the given operation 10 times', (done) => {
    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const op1 = {
      operationData: {
        collection: testCollection,
        propertyName: 'value',
      },
      instance: startLoop,
    };
    const op2 = {
      operationData: {},
      instance: function (op) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(op.value);
        return op;
      },
    };
    const op3 = {
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
        operationData.newCollection.forEach((letter, index) => {
          expect(letter).to.be.equal(testCollection[index]);
        });
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should loop the given async operation 10 times', (done) => {
    const testCollection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const op1 = {
      operationData: {
        collection: testCollection,
        propertyName: 'value',
      },
      instance: startLoop,
    };
    const op2 = {
      operationData: {},
      instance: function (op) {
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
        operationData.newCollection.forEach((letter, index) => {
          expect(letter).to.be.equal(testCollection[index]);
        });
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should skip the loop for an empty collection', (done) => {
    const testCollection = [];
    const op1 = {
      operationData: {
        collection: testCollection,
        propertyName: 'value',
      },
      instance: startLoop,
    };
    const op2 = {
      operationData: {},
      instance: function (op) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(op.value);
        return op;
      },
    };
    const op3 = {
      operationData: {},
      instance: endLoop,
    };
    const op4 = {
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
      .catch((e) => {
        done(e);
      });
  });

  it('should skip the loop for a null collection', (done) => {
    const testCollection = null;
    const op1 = {
      operationData: {
        collection: testCollection,
        propertyName: 'value',
      },
      instance: startLoop,
    };
    const op2 = {
      operationData: {},
      instance: function (op) {
        if (!op.newCollection) {
          op.newCollection = [];
        }
        op.newCollection.push(op.value);
        return op;
      },
    };
    const op3 = {
      operationData: {},
      instance: endLoop,
    };
    const op4 = {
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
      .catch((e) => {
        done(e);
      });
  });
});
