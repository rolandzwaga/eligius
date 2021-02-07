import { expect } from 'chai';
import { customFunction } from '../operation/custom-function';

class MockEventbus {
  testFunction: Function;
  constructor(testFunction) {
    this.testFunction = testFunction;
  }

  broadcast(_eventName, args) {
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
    const func = (opData, eventbus) => {
      called = true;
      expect(opData).to.equal(operationData);
      expect(eventbus).to.equal(mockEventbus);
    };
    const mockEventbus = new MockEventbus(func);

    // test
    const promise = customFunction(operationData, mockEventbus as any) as Promise<any>;

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
    const func = (opData, eventbus) => {
      return new Promise((resolve) => {
        called = true;
        expect(opData).to.equal(operationData);
        expect(eventbus).to.equal(mockEventbus);
        resolve();
      });
    };
    const mockEventbus = new MockEventbus(func);

    // test
    const promise = customFunction(operationData, mockEventbus as any) as Promise<any>;

    // expect
    return promise.then(() => {
      expect(called).to.be.true;
    });
  });
});
