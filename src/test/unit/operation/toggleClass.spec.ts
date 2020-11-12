import { expect } from 'chai';
import toggleClass from '../../operation/toggleClass';

class MockElement {
  toggleClass(className) {
    this.className = className;
  }
}

describe('toggleClass', () => {
  it('should toggle the specified clas on the given element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
      className: 'testClass',
    };

    // test
    const newData = toggleClass(operationData);

    // expect
    expect(mockElement.className).to.equal(operationData.className);
    expect(newData).to.equal(operationData);
  });
});
