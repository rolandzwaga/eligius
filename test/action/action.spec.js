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
});
