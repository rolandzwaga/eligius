import { expect } from 'chai';
import { suite } from 'uvu';
import { animateWithClass } from '../../../operation/animate-with-class';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  removedCalled = false;
  expectedClass: string;
  handler: () => void = () => {};

  constructor(expectedClass: string) {
    this.expectedClass = expectedClass;
  }

  one(_eventNames: string[], handler: () => void) {
    this.handler = handler;
  }

  addClass(className: string) {
    expect(className).to.equal(this.expectedClass);
  }

  removeClass(className: string) {
    this.removedCalled = true;
    expect(className).to.equal(this.expectedClass);
  }
}

const AnimateWithClassSuite = suite('animateWithClass');

AnimateWithClassSuite.skip(
  'should animate by adding the specified class, and remove the class afterwards',
  async () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
    };

    // test
    mockElement.handler();
    await applyOperation<Promise<typeof operationData>>(
      animateWithClass,
      operationData
    );
    expect(mockElement.removedCalled).to.be.true;
  }
);

AnimateWithClassSuite.skip(
  'should animate by adding the specified class, and keep the class afterwards',
  async () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
      removeClass: false,
    };

    // test
    mockElement.handler();
    await applyOperation<Promise<typeof operationData>>(
      animateWithClass,
      operationData
    );
    expect(mockElement.removedCalled).to.be.false;
  }
);

AnimateWithClassSuite.run();
