import { expect } from 'chai';
import { animateWithClass } from '~/operation/animate-with-class';

class MockElement {
  removedCalled = false;
  expectedClass: string;
  handler: Function;

  constructor(expectedClass) {
    this.expectedClass = expectedClass;
  }

  one(_eventNames, handler) {
    this.handler = handler;
  }

  addClass(className) {
    expect(className).to.equal(this.expectedClass);
  }

  removeClass(className) {
    this.removedCalled = true;
    expect(className).to.equal(this.expectedClass);
  }
}

describe('animateWithClass', () => {
  it('should animate by adding the specified class, and remove the class afterwards', () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      className: 'testClass',
    };

    // test
    const promise = animateWithClass(operationData, {} as any);
    mockElement.handler();
    expect(mockElement.removedCalled).to.be.true;
    return promise;
  });

  it('should animate by adding the specified class, and keep the class afterwards', () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      className: 'testClass',
      removeClass: false,
    };

    // test
    const promise = animateWithClass(operationData, {} as any);
    mockElement.handler();
    expect(mockElement.removedCalled).to.be.false;
    return promise;
  });
});
