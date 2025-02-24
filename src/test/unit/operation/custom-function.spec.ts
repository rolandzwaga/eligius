import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { IEventbus } from '../../../eventbus/index.ts';
import { customFunction } from '../../../operation/custom-function.ts';
import type { IOperationContext, TOperation } from '../../../operation/index.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockEventbus {
  testFunction: Function;
  constructor(testFunction: Function) {
    this.testFunction = testFunction;
  }

  broadcast(_eventName: string, args: any[]) {
    args[1](this.testFunction);
  }
}

describe.concurrent('customFunction', () => {
  test('should resolve and execute the specified function', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };

    let called = false;
    const func = function(this: IOperationContext, opData: TOperation) {
      called = true;
      expect(opData).to.equal(operationData);
      expect(this.eventbus).to.equal(mockEventbus);
    };
    const mockEventbus = new MockEventbus(func);

    // test
    await applyOperation<Promise<any>>(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(called).to.be.true;
  });
  test('should resolve and execute the specified function that itself returns a promise', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const func = function(this: IOperationContext, opData: TOperation) {
      return new Promise<void>((resolve) => {
        called = true;
        expect(opData).to.equal(operationData);
        expect(this.eventbus).to.equal(mockEventbus);
        resolve();
      });
    };
    const mockEventbus = new MockEventbus(func);

    // test
    const result = await applyOperation<Promise<any>>(
      customFunction,
      operationData,
      {
        currentIndex: -1,
        eventbus: mockEventbus as unknown as IEventbus,
        operations: [],
      }
    );

    // expect
    expect(called).to.be.true;
    return result;
  });
});
