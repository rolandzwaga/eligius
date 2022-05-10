import { expect } from 'chai';
import { suite } from 'uvu';
import { Eventbus, IEventbus } from '../../../eventbus';
import { TOperation } from '../../../operation';
import { customFunction } from '../../../operation/custom-function';
import { applyOperation } from '../../../util/apply-operation';

class MockEventbus {
  testFunction: Function;
  constructor(testFunction: Function) {
    this.testFunction = testFunction;
  }

  broadcast(_eventName: string, args: any[]) {
    args[1](this.testFunction);
  }
}

const CustomFunctionSuite = suite('customFunction');

CustomFunctionSuite(
  'should resolve and execute the specified function',
  async () => {
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
    await applyOperation<Promise<any>>(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
    });

    // expect
    expect(called).to.be.true;
  }
);

CustomFunctionSuite(
  'should resolve and execute the specified function that itself returns a promise',
  async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const func = (opData: TOperation, eventbus: Eventbus) => {
      return new Promise<void>((resolve) => {
        called = true;
        expect(opData).to.equal(operationData);
        expect(eventbus).to.equal(mockEventbus);
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
      }
    );

    // expect
    expect(called).to.be.true;
    return result;
  }
);

CustomFunctionSuite.run();
