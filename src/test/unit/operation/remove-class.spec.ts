import { expect } from 'chai';
import { describe, test } from 'vitest';
import { removeClass } from '../../../operation/remove-class.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockElement {
  removedClassName: string = '';

  removeClass(className: string) {
    this.removedClassName = className;
  }
}

describe.concurrent('removeClass', () => {
  test('should remove the class from the given element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
    };

    // test
    applyOperation(removeClass, operationData);

    // expect
    expect(mockElement.removedClassName).to.equal(operationData.className);
  });
});
