import {expect, describe, test} from 'vitest';
import {toggleClass} from '../../../operation/toggle-class.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

class MockElement {
  className: string = '';
  toggleClass(className: string) {
    this.className = className;
  }
}

describe('toggleClass', () => {
  test('should toggle the specified clas on the given element', () => {
    // given
    const mockElement: JQuery = new MockElement() as any;
    const operationData = {
      selectedElement: mockElement,
      className: 'testClass',
    };

    // test
    const newData = applyOperation(toggleClass, operationData);

    // expect
    expect((mockElement as any).className).toBe('testClass');
    expect(newData).toBe(operationData);
  });

  test('should remove the className property from the operation data', () => {
    // given
    const mockElement: JQuery = new MockElement() as any;
    const operationData = {
      selectedElement: mockElement,
      className: 'testClass',
    };

    // test
    const newData = applyOperation(toggleClass, operationData);

    // expect
    expect('className' in newData).toBe(false);
  });
});
