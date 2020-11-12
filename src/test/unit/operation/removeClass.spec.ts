import { expect } from 'chai';
import removeClass from '../../operation/removeClass';

class MockElement {
  removeClass(className) {
    this.className = className;
  }
}

describe('removeClass', () => {
  it('should remove the class from the given element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
      className: 'testClass',
    };

    // test
    removeClass(operationData);

    // expect
    expect(mockElement.className).to.equal(operationData.className);
  });
});
