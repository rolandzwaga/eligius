import { expect } from 'chai';
import { removeClass } from '../../../operation/remove-class';
import { applyOperation } from './apply-operation';

class MockElement {
  removedClassName: string = '';

  removeClass(className: string) {
    this.removedClassName = className;
  }
}

describe('removeClass', () => {
  it('should remove the class from the given element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      className: 'testClass',
    };

    // test
    applyOperation(removeClass, operationData);

    // expect
    expect(mockElement.removedClassName).to.equal(operationData.className);
  });
});
