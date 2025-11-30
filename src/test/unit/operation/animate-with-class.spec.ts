import {expect, describe, test} from 'vitest';
import {animateWithClass} from '../../../operation/animate-with-class.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(className).toBe(this.expectedClass);
  }

  removeClass(className: string) {
    this.removedCalled = true;
    expect(className).toBe(this.expectedClass);
  }
}

describe('animateWithClass', () => {
  test('should animate by adding the specified class, and remove the class afterwards', () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
    };

    // test

    applyOperation(animateWithClass, operationData).then(() => {
      expect(mockElement.removedCalled).toBe(true);
    });
    mockElement.handler();
  });
  test('should animate by adding the specified class, and keep the class afterwards', async () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
      removeClass: false,
    };

    // test

    applyOperation(animateWithClass, operationData).then(() => {
      expect(mockElement.removedCalled).toBe(false);
    });
    mockElement.handler();
  });
});
