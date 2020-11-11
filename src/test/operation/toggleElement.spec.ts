import { expect } from 'chai';
import toggleElement from '../../operation/toggleElement';

class MockElement {
  toggle() {
    this.isToggled = true;
  }
}

describe('toggleElement', () => {
  it('should toggle the given element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
    };

    // test
    const newData = toggleElement(operationData);

    // expect
    expect(newData).to.equal(operationData);
    expect(mockElement.isToggled).to.be.true;
  });
});
