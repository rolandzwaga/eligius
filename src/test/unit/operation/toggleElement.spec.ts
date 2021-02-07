import { expect } from 'chai';
import { toggleElement } from '../operation/toggle-element';

class MockElement {
  isToggled: boolean;
  toggle() {
    this.isToggled = true;
  }
}

describe('toggleElement', () => {
  it('should toggle the given element', () => {
    // given
    const mockElement: JQuery = new MockElement() as any;
    const operationData = {
      selectedElement: mockElement,
    };

    // test
    const newData = toggleElement(operationData, {} as any);

    // expect
    expect(newData).to.equal(operationData);
    expect((mockElement as any).isToggled).to.be.true;
  });
});
