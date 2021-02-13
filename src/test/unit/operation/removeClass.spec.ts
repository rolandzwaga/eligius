import { expect } from 'chai';
import { removeClass } from '../../../operation/remove-class';

class MockElement {
  className: string;

  removeClass(className) {
    this.className = className;
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
    removeClass(operationData, {} as any);

    // expect
    expect(mockElement.className).to.equal(operationData.className);
  });
});
