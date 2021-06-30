import { expect } from 'chai';
import { Eventbus } from '../../../eventbus';
import { TOperation } from '../../../operation';
import { customFunction } from '../../../operation/custom-function';
import { applyOperation } from './apply-operation';

class MockEventbus {
  testFunction: Function;
  constructor(testFunction: Function) {
    this.testFunction = testFunction;
  }

  broadcast(_eventName: string, ...args: any[]) {
    args[1](this.testFunction);
  }
}

describe('customFunction', () => {
  it('should resolve and execute the specified function', () => {
    // given
    const operationData = {
      systemName: 'testName',
    };

    let called = false;
    const func = (opData: TOperation, eventbus: Eventbus) => {
      called = true;
      expect(opData).to.equal(operationData);
      expect(eventbus).to.equal(mockEventbus);
    };
    const mockEventbus = new MockEventbus(func);

    // test
    const promise = applyOperation<Promise<any>>(customFunction, operationData);

    // expect
    return promise.then(() => {
      expect(called).to.be.true;
    });
  });

  it('should resolve and execute the specified function that itself returns a promise', () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const func = (opData: TOperation, eventbus: Eventbus) => {
      return new Promise<void>(resolve => {
        called = true;
        expect(opData).to.equal(operationData);
        expect(eventbus).to.equal(mockEventbus);
        resolve();
      });
    };
    const mockEventbus = new MockEventbus(func);

    // test
    const promise = applyOperation<Promise<any>>(customFunction, operationData);

    // expect
    return promise.then(() => {
      expect(called).to.be.true;
    });
  });
});
